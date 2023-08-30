import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { useDispatchCart, useCart } from "./ContextReducer";
import "../card.css"
const Card = (props) => {
  const option = props.option;
  const priceOption = Object.keys(option);

  const data = useCart();
  const dispatch = useDispatchCart();

  const priceRef = useRef();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    let existingItem = data.find(
      (item) => item.id === props.foodItem._id && item.size === size
    );

    if (existingItem) {
      // Update existing item in the cart
      await dispatch({
        type: "UPDATE",
        id: props.foodItem._id,
        price: finalPrice,
        qty,
        size,
      });
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false); // Reset button text to "Added to cart"
      }, 2000);
    } else {
      // Add new item to the cart
      await dispatch({
        type: "ADD",
        id: props.foodItem._id,
        name: props.foodItem.name,
        price: finalPrice,
        img: props.foodItem.img,
        qty,
        size,
      });
      setIsAdded(true);
    }
  };

  let finalPrice = qty * parseInt(option[size]);
  useEffect(() => setSize(priceRef.current.value), []);

  return (
    <div className="card-container">
      <div className="card">
        <img
          src={props.foodItem.img}
          className="card-img-top card-image"
          alt="..."
          
        />

        <div className="card-body card-details">
          <h5 className="card-title card-name">{props.foodItem.name}</h5>

          <div className="card-options">
            <select
              className="card-quantity"
              onChange={(e) => setQty(e.target.value)}
            >
              {Array.from(Array(6), (el, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>

            <select
              className="card-size"
              ref={priceRef}
              onChange={(e) => setSize(e.target.value)}
            >
              {priceOption.map((data) => (
                <option className="card-option" key={data} value={data}>
                  {data}
                </option>
              ))}
            </select>
          </div>

          <div className="card-price-button">
            <p className="card-price">
              Price: <FontAwesomeIcon icon={faRupeeSign} /> {finalPrice}
            </p>
            <div
              className={`card-button btn btn-danger ${
                isAdded ? "added-button" : "add-button"
              }`}
              onClick={handleAddToCart}
            >
              {isAdded ? "Added to Cart" : "Add to Cart"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
