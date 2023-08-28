import React, { useState } from "react";
import Delete from "@material-ui/icons/Delete";
import { useCart, useDispatchCart } from "../components/ContextReducer";

export default function Cart() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  let data = useCart();
  let dispatch = useDispatchCart();

  const handleRemove = (index) => {
    setDeleteIndex(index);
    const result = window.confirm("Are you sure you want to delete this item?");
    if (result) {
      dispatch({ type: "REMOVE", index: deleteIndex });
    }
  };
  const handleCheckOut = async () => {
    let userEmail = localStorage.getItem("userEmail");

    try {
      let response = await fetch("http://localhost:4000/api/user/orderData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_data: data,
          email: userEmail,
          order_date: new Date().toDateString(),
        }),
      });

      console.log("Response Status:", response.status);

      if (response.status === 200) {
        dispatch({ type: "DROP" });
      } else {
        console.error("Error during checkout:", response.statusText);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  let totalPrice = data.reduce((total, food) => total + food.price, 0);

  return (
    <div>
      {data.length === 0 ? (
        <div>
          <div className="m-5 w-100 text-white text-center fs-3">
            The Cart is Empty!
          </div>
        </div>
      ) : (
        <div className="container m-auto mt-5 table-responsive  table-responsive-sm table-responsive-md">
          <table className="table table-hover ">
            <thead className=" text-success fs-4">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Quantity</th>
                <th scope="col">Option</th>
                <th scope="col">Amount</th>
                {/* <th scope="col"></th> */}
              </tr>
            </thead>
            <tbody>
              {data.map((food, index) => (
                <tr key={index}>
                  <th scope="row">{index + 1}</th>
                  <td>{food.name}</td>
                  <td>{food.qty}</td>
                  <td>{food.size}</td>
                  <td>{food.price}</td>
                  <td>
                    <button
                      type="button"
                      className="btn p-0"
                      onClick={() => handleRemove(index)}
                    >
                      <Delete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <h1 className="fs-2 text-white">Total Price: {totalPrice}/-</h1>
          </div>
          <div>
            <button className="btn bg-info mt-5" onClick={handleCheckOut}>
              Check Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
