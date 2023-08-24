import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { useDispatchCart, useCart } from "./ContextReducer";

const Card = (props) => {
  const option = props.option;
  const priceOption = Object.keys(option);
  // const priceOp = Object.values(option);
  //  let foodItem = props.foodItem;
  const data = useCart();
  const dispatch = useDispatchCart();
  const priceRef = useRef();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");

  const handleAddToCart = async () => {
    await dispatch({
      type: "ADD",
      id: props.foodItem._id,
      name: props.foodItem.name,
      price: finalPrice,
      qty,
      size,
    });

    console.log(data);
  };
  let finalPrice = qty * parseInt(option[size]);
  useEffect(() => setSize(priceRef.current.value), []);

  return (
    <div>
      <div>
        <div className="card m-4 " style={{ width: "20rem", height: "20rem" }}>
          <img
            src={props.foodItem.img}
            className="card-img-top"
            style={{
              width: "auto",
              height: "170px",
              maxHeight: "15rem",
              objectFit: "fill",
              objectPosition: "center",
            }}
            alt="..."
          />

          <div className="card-body bg-dark text-white">
            <h5 className="card-title">{props.foodItem.name}</h5>

            <div className="container w-100">
              <div className="row ">
                <div className="col ">
                  <select
                    className="text-bold btn btn-danger "
                    onChange={(e) => setQty(e.target.value)}
                  >
                    {Array.from(Array(6), (el, i) => {
                      return (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col ">
                  <select
                    className=" text-bold btn btn-danger "
                    ref={priceRef}
                    onChange={(e) => setSize(e.target.value)}
                  >
                    {priceOption.map((data) => {
                      return (
                        <option className="text-white" key={data} value={data}>
                          {data}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <br />
                <br />

                <hr />
                <div className="row">
                  <div className="col">
                    <p>
                      Price: <FontAwesomeIcon icon={faRupeeSign} />
                      / {finalPrice}
                    </p>
                  </div>
                  <div className="col btn btn-info" onClick={handleAddToCart}>
                    Add to cart
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
