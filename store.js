const Store = (() => {

  const STORAGE_KEY = "mini_mart_pos_v1";

  const initialData = {

    products: [

      {
        id: "p001",
        barcode: "885000000001",
        name: "น้ำดื่ม 600ml",
        category: "เครื่องดื่ม",
        cost: 5,
        price: 10,
        stock: 48,
        reorder: 10
      },

      {
        id: "p002",
        barcode: "885000000002",
        name: "โค้ก 325ml",
        category: "เครื่องดื่ม",
        cost: 10,
        price: 15,
        stock: 24,
        reorder: 6
      },

      {
        id: "p003",
        barcode: "885000000003",
        name: "มันฝรั่งทอด",
        category: "ขนม",
        cost: 12,
        price: 20,
        stock: 18,
        reorder: 5
      },

      {
        id: "p004",
        barcode: "885000000004",
        name: "บะหมี่กึ่งสำเร็จรูป",
        category: "อาหาร",
        cost: 6,
        price: 8,
        stock: 35,
        reorder: 8
      }

    ],

    sales: [],

    expenses: []

  };


  let state;

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    state =
      saved
        ? JSON.parse(saved)
        : structuredClone(initialData);

  } catch {

    state =
      structuredClone(initialData);

  }


  function save() {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

  }


  function id(prefix) {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7)
    );

  }


  return {

    get products() {
      return state.products;
    },

    get sales() {
      return state.sales;
    },

    get expenses() {
      return state.expenses;
    },


    addProduct(product) {

      state.products.push({

        ...product,

        id: id("product")

      });

      save();

    },


    updateStock(productId, amount) {

      const product =
        state.products.find(
          p => p.id === productId
        );

      if (!product) {

        throw new Error(
          "ไม่พบสินค้า"
        );

      }


      if (
        product.stock + amount < 0
      ) {

        throw new Error(
          "Stock ไม่เพียงพอ"
        );

      }


      product.stock += amount;

      save();

    },


    addSale(sale) {

      state.sales.unshift({

        ...sale,

        id: id("sale"),

        date:
          new Date().toISOString()

      });

      save();

    },


    addExpense(expense) {

      state.expenses.unshift({

        ...expense,

        id: id("expense"),

        date:
          new Date().toISOString()

      });

      save();

    }

  };

})();
