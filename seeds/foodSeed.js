const foodCategories = [
  { CategoryName: "Pizza" },
  { CategoryName: "Burger" },
  { CategoryName: "Dessert" },
  { CategoryName: "Drinks" },
];

const foodItems = [
  {
    id: 1,
    name: "Margherita Pizza",
    CategoryName: "Pizza",
    price: 299,
    img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    description: "Classic tomato and mozzarella pizza",
    options: [{ label: "Full", price: 299 }, { label: "Half", price: 169 }],
  },
  {
    id: 2,
    name: "Pepperoni Pizza",
    CategoryName: "Pizza",
    price: 399,
    img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400",
    description: "Loaded with pepperoni and cheese",
    options: [{ label: "Full", price: 399 }, { label: "Half", price: 219 }],
  },
  {
    id: 3,
    name: "Classic Burger",
    CategoryName: "Burger",
    price: 199,
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    description: "Juicy beef patty with fresh veggies",
    options: [{ label: "Regular", price: 199 }, { label: "Large", price: 249 }],
  },
  {
    id: 4,
    name: "Cheese Burger",
    CategoryName: "Burger",
    price: 249,
    img: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400",
    description: "Double cheese loaded burger",
    options: [{ label: "Regular", price: 249 }, { label: "Large", price: 299 }],
  },
  {
    id: 5,
    name: "Chocolate Brownie",
    CategoryName: "Dessert",
    price: 149,
    img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
    description: "Rich chocolate fudge brownie",
    options: [{ label: "Single", price: 149 }, { label: "Double", price: 199 }],
  },
  {
    id: 6,
    name: "Cold Coffee",
    CategoryName: "Drinks",
    price: 99,
    img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
    description: "Iced coffee with cream",
    options: [{ label: "Regular", price: 99 }, { label: "Large", price: 129 }],
  },
];

module.exports = { foodCategories, foodItems };
