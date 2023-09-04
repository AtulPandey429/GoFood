import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { useDispatchCart, useCart } from "./ContextReducer";
import { useNavigate } from "react-router-dom";
import "./zomato-card.css"; // Create a separate CSS file for Zomato-style card styling

const Card = (props) => {
  const option = props.option;
  const priceOption = Object.keys(option);

  const data = useCart();
  const dispatch = useDispatchCart();
  const navigate = useNavigate();

  const priceRef = useRef();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!localStorage.getItem("authToken")) {
      navigate("/login");
      return;
    }

    let existingItem = data.find(
      (item) => item.id === props.foodItem._id && item.size === size
    );

    if (existingItem) {
      await dispatch({
        type: "UPDATE",
        id: props.foodItem._id,
        price: finalPrice,
        qty,
        size,
      });
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } else {
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
    <div className="zomato-card-container">
      <div className="zomato-card">
        <div className="zomato-card-img-container">
          <img
            src={props.foodItem.img}
            className="zomato-card-img-top zomato-card-image"
            alt="..."
          />
        </div>

        <div className="zomato-card-body zomato-card-details">
          <h5 className="zomato-card-title zomato-card-name">
            {props.foodItem.name}
          </h5>

          <div className="zomato-card-options">
            <select
              className="zomato-card-quantity"
              onChange={(e) => setQty(e.target.value)}
            >
              {Array.from(Array(6), (el, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>

            <select
              className="zomato-card-size"
              ref={priceRef}
              onChange={(e) => setSize(e.target.value)}
            >
              {priceOption.map((data) => (
                <option className="zomato-card-option" key={data} value={data}>
                  {data}
                </option>
              ))}
            </select>
          </div>

          <div className="zomato-card-price-button">
            <p className="zomato-card-price">
              Price: <FontAwesomeIcon icon={faRupeeSign} /> {finalPrice}
            </p>
            <div
              className={`zomato-card-button btn btn-danger ${
                isAdded ? "zomato-added-button" : "zomato-add-button"
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
