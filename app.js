const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  [...document.querySelectorAll(selector)];


const money = value =>
  new Intl.NumberFormat(
    "th-TH",
    {
      style: "currency",
      currency: "THB"
    }
  ).format(value || 0);


const today = () =>
  new Date()
    .toISOString()
    .slice(0, 10);


let cart = [];



/* =========================
   CALCULATIONS
========================= */

function todaySales() {

  return Store.sales.filter(
    sale =>
      sale.date.slice(0, 10) === today()
  );

}


function todayExpenses() {

  return Store.expenses.filter(
    expense =>
      expense.date.slice(0, 10) === today()
  );

}


function calculateToday() {

  const sales =
    todaySales();

  const expenses =
    todayExpenses();


  const revenue =
    sales.reduce(
      (sum, sale) =>
        sum + sale.total,
      0
    );


  const cost =
    sales.reduce(
      (sum, sale) =>
        sum + sale.cost,
      0
    );


  const expense =
    expenses.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );


  const grossProfit =
    revenue - cost;


  const netProfit =
    grossProfit - expense;


  return {

    revenue,
    cost,
    expense,
    grossProfit,
    netProfit

  };

}



/* =========================
   DASHBOARD
========================= */

function renderDashboard() {

  const totals =
    calculateToday();


  $("#dashboardCards").innerHTML = [

    [
      "ยอดขายวันนี้",
      money(totals.revenue),
      "Sales"
    ],

    [
      "ต้นทุนสินค้า",
      money(totals.cost),
      "Cost of Goods"
    ],

    [
      "กำไรขั้นต้น",
      money(totals.grossProfit),
      "Gross Profit"
    ],

    [
      "กำไรสุทธิ",
      money(totals.netProfit),
      "Net Profit"
    ]

  ]

    .map(
      card => `

        <div class="card">

          <div class="card-label">
            ${card[0]}
          </div>

          <div class="card-value">
            ${card[1]}
          </div>

          <div class="card-note">
            ${card[2]}
          </div>

        </div>

      `
    )

    .join("");


  const lowStock =
    Store.products.filter(
      product =>
        product.stock <= product.reorder
    );


  $("#lowStock").innerHTML =

    lowStock.length

      ? lowStock
          .map(
            product => `

              <div class="list-row">

                <div>

                  <strong>
                    ${product.name}
                  </strong>

                  <small>
                    ${product.barcode}
                  </small>

                </div>

                <span
                  class="status ${
                    product.stock === 0
                      ? "out"
                      : "low"
                  }"
                >

                  ${
                    product.stock === 0
                      ? "หมด"
                      : `เหลือ ${product.stock}`
                  }

                </span>

              </div>

            `
          )
          .join("")

      : `
        <div class="empty">
          ไม่มีสินค้าใกล้หมด 🎉
        </div>
      `;


  $("#recentSales").innerHTML =

    Store.sales.length

      ? Store.sales
          .slice(0, 5)
          .map(
            sale => `

              <div class="list-row">

                <div>

                  <strong>
                    ${sale.items
                      .map(item => item.name)
                      .join(", ")}
                  </strong>

                  <small>
                    ${
                      new Date(
                        sale.date
                      ).toLocaleTimeString(
                        "th-TH",
                        {
                          hour: "2-digit",
                          minute: "2-digit"
                        }
                      )
                    }
                  </small>

                </div>

                <strong>
                  ${money(sale.total)}
                </strong>

              </div>

            `
          )
          .join("")

      : `
        <div class="empty">
          ยังไม่มีรายการขาย
        </div>
      `;

}



/* =========================
   POS
========================= */

function renderPOS() {

  const query =
    $("#posSearch")
      .value
      .trim()
      .toLowerCase();


  const products =
    Store.products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(query)

        ||

        product.barcode
          .includes(query)
    );


  $("#productGrid").innerHTML =

    products
      .map(
        product => `

          <button
            class="product-card"
            data-add="${product.id}"
            ${
              product.stock === 0
                ? "disabled"
                : ""
            }
          >

            <strong>
              ${product.name}
            </strong>

            <span class="product-price">
              ${money(product.price)}
            </span>

            <small>
              Stock ${product.stock}
            </small>

          </button>

        `
      )
      .join("");


  renderCart();

}



function renderCart() {

  if (!cart.length) {

    $("#cart").innerHTML = `

      <div class="empty">

        🛒

        <br />

        ยังไม่มีสินค้าในตะกร้า

      </div>

    `;

    $("#cartTotal").textContent =
      money(0);

    return;

  }


  $("#cart").innerHTML =

    cart
      .map(
        item => `

          <div class="cart-item">

            <div>

              <strong>
                ${item.name}
              </strong>

              <small>
                ${money(item.price)}
              </small>

              <div class="qty">

                <button
                  data-dec="${item.id}"
                >
                  −
                </button>

                <span>
                  ${item.quantity}
                </span>

                <button
                  data-inc="${item.id}"
                >
                  +
                </button>

              </div>

            </div>

            <strong>
              ${
                money(
                  item.price *
                  item.quantity
                )
              }
            </strong>

          </div>

        `
      )
      .join("");


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  $("#cartTotal").textContent =
    money(total);

}



function addToCart(productId) {

  const product =
    Store.products.find(
      p => p.id === productId
    );


  if (!product) return;


  const existing =
    cart.find(
      item =>
        item.id === productId
    );


  if (existing) {

    if (
      existing.quantity >=
      product.stock
    ) {

      toast(
        "จำนวนสินค้าเกิน Stock"
      );

      return;

    }


    existing.quantity++;

  } else {

    cart.push({

      id: product.id,

      name: product.name,

      price: product.price,

      cost: product.cost,

      quantity: 1

    });

  }


  renderCart();

}



function changeQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      item =>
        item.id === productId
    );


  if (!item) return;


  const product =
    Store.products.find(
      p => p.id === productId
    );


  item.quantity += amount;


  if (item.quantity <= 0) {

    cart =
      cart.filter(
        item =>
          item.id !== productId
      );

  }


  if (
    product &&
    item.quantity > product.stock
  ) {

    item.quantity =
      product.stock;

  }


  renderCart();

}



/* =========================
   CHECKOUT
========================= */

function openCheckout() {

  if (!cart.length) {

    toast(
      "กรุณาเพิ่มสินค้าก่อน"
    );

    return;

  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  $("#checkoutTotal")
    .textContent =
    money(total);


  $("#cashReceived")
    .value = "";


  $("#change")
    .textContent =
    money(0);


  $("#checkoutDialog")
    .showModal();

}



function finishSale() {

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  const cost =
    cart.reduce(
      (sum, item) =>
        sum +
        item.cost *
        item.quantity,
      0
    );


  const payment =
    $("#paymentMethod")
      .value;


  const cash =
    payment === "cash"
      ? Number(
          $("#cashReceived").value
        )
      : total;


  if (
    payment === "cash" &&
    cash < total
  ) {

    toast(
      "เงินที่รับน้อยกว่ายอดขาย"
    );

    return;

  }


  try {

    cart.forEach(item => {

      Store.updateStock(
        item.id,
        -item.quantity
      );

    });


    Store.addSale({

      items:
        structuredClone(cart),

      total,

      cost,

      payment,

      cash,

      change:
        cash - total

    });


    cart = [];


    $("#checkoutDialog")
      .close();


    renderAll();


    toast(
      "ขายสินค้าเรียบร้อย ✓"
    );

  } catch (error) {

    toast(error.message);

  }

}



/* =========================
   PRODUCTS
========================= */

function renderProducts() {

  const query =
    $("#productSearch")
      .value
      .trim()
      .toLowerCase();


  const products =
    Store.products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(query)

        ||

        product.barcode
          .includes(query)
    );


  $("#productTable").innerHTML =

    products
      .map(
        product => {

          let status =
            "ปกติ";

          let statusClass =
            "ok";


          if (
            product.stock === 0
          ) {

            status =
              "หมด";

            statusClass =
              "out";

          } else if (
            product.stock <=
            product.reorder
          ) {

            status =
              "ใกล้หมด";

            statusClass =
              "low";

          }


          return `

            <tr>

              <td>
                ${product.barcode}
              </td>

              <td>
                <strong>
                  ${product.name}
                </strong>
              </td>

              <td>
                ${product.category}
              </td>

              <td>
                ${money(product.cost)}
              </td>

              <td>
                ${money(product.price)}
              </td>

              <td>
                ${product.stock}
              </td>

              <td>

                <span
                  class="status ${statusClass}"
                >
                  ${status}
                </span>

              </td>

            </tr>

          `;

        }
      )
      .join("");

}



/* =========================
   EXPENSES
========================= */

function renderExpenses() {

  $("#expenseTable").innerHTML =

    Store.expenses.length

      ? Store.expenses
          .map(
            expense => `

              <tr>

                <td>
                  ${
                    new Date(
                      expense.date
                    ).toLocaleDateString(
                      "th-TH"
                    )
                  }
                </td>

                <td>
                  ${expense.name}
                </td>

                <td>
                  ${expense.category}
                </td>

                <td>
                  <strong>
                    ${money(expense.amount)}
                  </strong>
                </td>

              </tr>

            `
          )
          .join("")

      : `

          <tr>

            <td
              colspan="4"
              class="empty"
            >
              ยังไม่มีค่าใช้จ่าย
            </td>

          </tr>

        `;

}



/* =========================
   REPORTS
========================= */

function renderReports() {

  const totals =
    calculateToday();


  $("#reportCards").innerHTML = [

    [
      "ยอดขายวันนี้",
      totals.revenue
    ],

    [
      "กำไรขั้นต้น",
      totals.grossProfit
    ],

    [
      "ค่าใช้จ่าย",
      totals.expense
    ],

    [
      "กำไรสุทธิ",
      totals.netProfit
    ]

  ]

    .map(
      card => `

        <div class="card">

          <div class="card-label">
            ${card[0]}
          </div>

          <div class="card-value">
            ${money(card[1])}
          </div>

        </div>

      `
    )

    .join("");


  $("#salesTable").innerHTML =

    Store.sales.length

      ? Store.sales
          .map(
            sale => `

              <tr>

                <td>
                  ${
                    new Date(
                      sale.date
                    ).toLocaleString(
                      "th-TH"
                    )
                  }
                </td>

                <td>
                  ${sale.items
                    .map(
                      item =>
                        `${item.name} ×${item.quantity}`
                    )
                    .join("<br>")}
                </td>

                <td>
                  ${
                    sale.payment === "cash"
                      ? "เงินสด"
                      : "โอน / QR"
                  }
                </td>

                <td>
                  ${money(sale.total)}
                </td>

                <td>
                  ${money(
                    sale.total -
                    sale.cost
                  )}
                </td>

              </tr>

            `
          )
          .join("")

      : `

          <tr>

            <td
              colspan="5"
              class="empty"
            >
              ยังไม่มีรายการขาย
            </td>

          </tr>

        `;

}



/* =========================
   NAVIGATION
========================= */

const titles = {

  dashboard: [
    "Dashboard",
    "ภาพรวมร้านวันนี้"
  ],

  pos: [
    "ขายสินค้า",
    "จุดขายสินค้า POS"
  ],

  products: [
    "สินค้า / Stock",
    "จัดการสินค้าและสต็อก"
  ],

  expenses: [
    "ค่าใช้จ่าย",
    "บันทึกค่าใช้จ่ายร้าน"
  ],

  reports: [
    "รายงาน",
    "ยอดขายและกำไร"
  ]

};


function showView(view) {

  $$(".view")
    .forEach(
      element =>
        element.classList.toggle(
          "active",
          element.id === view
        )
    );


  $$(".nav-item")
    .forEach(
      button =>
        button.classList.toggle(
          "active",
          button.dataset.view === view
        )
    );


  $("#pageTitle")
    .textContent =
    titles[view][0];


  $("#pageSubtitle")
    .textContent =
    titles[view][1];

}



/* =========================
   TOAST
========================= */

function toast(message) {

  const element =
    $("#toast");

  element.textContent =
    message;

  element.classList.add(
    "show"
  );


  setTimeout(
    () =>
      element.classList.remove(
        "show"
      ),
    2200
  );

}



/* =========================
   EVENTS
========================= */

document.addEventListener(
  "click",
  event => {

    const nav =
      event.target.closest(
        "[data-view]"
      );


    if (nav) {

      showView(
        nav.dataset.view
      );

    }


    const go =
      event.target.closest(
        "[data-go]"
      );


    if (go) {

      showView(
        go.dataset.go
      );

    }


    const add =
      event.target.closest(
        "[data-add]"
      );


    if (add) {

      addToCart(
        add.dataset.add
      );

    }


    const inc =
      event.target.closest(
        "[data-inc]"
      );


    if (inc) {

      changeQuantity(
        inc.dataset.inc,
        1
      );

    }


    const dec =
      event.target.closest(
        "[data-dec]"
      );


    if (dec) {

      changeQuantity(
        dec.dataset.dec,
        -1
      );

    }

  }
);



$("#posSearch")
  .addEventListener(
    "input",
    renderPOS
  );



$("#posSearch")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Enter"
      ) return;


      const barcode =
        event.target.value.trim();


      const product =
        Store.products.find(
          product =>
            product.barcode ===
            barcode
        );


      if (product) {

        addToCart(
          product.id
        );


        event.target.select();

      }

    }
  );



$("#clearCart")
  .onclick = () => {

    cart = [];

    renderCart();

  };



$("#checkoutButton")
  .onclick =
  openCheckout;



$("#cashReceived")
  .addEventListener(
    "input",
    () => {

      const total =
        cart.reduce(
          (sum, item) =>
            sum +
            item.price *
            item.quantity,
          0
        );


      const cash =
        Number(
          $("#cashReceived").value
        );


      $("#change")
        .textContent =
        money(
          Math.max(
            0,
            cash - total
          )
        );

    }
  );



$("#confirmSale")
  .onclick =
  event => {

    event.preventDefault();

    finishSale();

  };



$("#paymentMethod")
  .onchange =
  () => {

    $("#cashField")
      .style.display =
      $("#paymentMethod").value ===
      "cash"
        ? "grid"
        : "none";

  };



$("#productSearch")
  .addEventListener(
    "input",
    renderProducts
  );



$("#addProductButton")
  .onclick =
  () =>
    $("#productDialog")
      .showModal();



$("#productForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      Store.addProduct({

        barcode:
          $("#productBarcode")
            .value
            .trim(),

        name:
          $("#productName")
            .value
            .trim(),

        category:
          $("#productCategory")
            .value
            .trim(),

        cost:
          Number(
            $("#productCost").value
          ),

        price:
          Number(
            $("#productPrice").value
          ),

        stock:
          Number(
            $("#productStock").value
          ),

        reorder:
          Number(
            $("#productReorder").value
          )

      });


      event.target
        .closest("dialog")
        .close();


      event.target.reset();


      renderAll();


      toast(
        "เพิ่มสินค้าแล้ว"
      );

    }
  );



$("#addExpenseButton")
  .onclick =
  () =>
    $("#expenseDialog")
      .showModal();



$("#expenseForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      Store.addExpense({

        name:
          $("#expenseName")
            .value
            .trim(),

        category:
          $("#expenseCategory")
            .value,

        amount:
          Number(
            $("#expenseAmount")
              .value
          )

      });


      event.target
        .closest("dialog")
        .close();


      event.target.reset();


      renderAll();


      toast(
        "บันทึกค่าใช้จ่ายแล้ว"
      );

    }
  );



/* =========================
   CSV EXPORT
========================= */

$("#exportButton")
  .onclick = () => {

    const rows = [

      [
        "Date",
        "Items",
        "Payment",
        "Total",
        "Gross Profit"
      ],

      ...Store.sales.map(
        sale => [

          sale.date,

          sale.items
            .map(
              item =>
                `${item.name} x${item.quantity}`
            )
            .join(" | "),

          sale.payment,

          sale.total,

          sale.total -
          sale.cost

        ]
      )

    ];


    const csv =
      "\uFEFF" +
      rows
        .map(
          row =>
            row
              .map(
                value =>
                  `"${String(value)
                    .replaceAll(
                      '"',
                      '""'
                    )}"`
              )
              .join(",")
        )
        .join("\n");


    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8"
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;

    link.download =
      `sales-${today()}.csv`;


    link.click();


    URL.revokeObjectURL(url);

  };



/* =========================
   RENDER
========================= */

function renderAll() {

  renderDashboard();

  renderPOS();

  renderProducts();

  renderExpenses();

  renderReports();

}


renderAll();

$("#paymentMethod")
  .dispatchEvent(
    new Event("change")
  );
