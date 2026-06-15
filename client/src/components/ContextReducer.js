import { createContext, useContext, useReducer } from "react";

const CartStateContext = createContext();
const CartDispatchContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD":
      return [
        ...state,
        {
          id: action.id,
          name: action.name,
          price: action.price,
          img: action.img,
          qty: action.qty,
          size: action.size,
        },
      ];
    case "REMOVE": {
      const newArr = [...state];
      newArr.splice(action.index, 1);
      return newArr;
    }
    case "UPDATE":
      return state.map((food) =>
        food.id === action.id && food.size === action.size
          ? { ...food, qty: action.qty, price: action.price }
          : food
      );
    case "DROP":
      return [];
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, []);
  return (
    <CartDispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={state}>
        {children}
      </CartStateContext.Provider>
    </CartDispatchContext.Provider>
  );
};

export const useCart = () => useContext(CartStateContext);
export const useDispatchCart = () => useContext(CartDispatchContext);
