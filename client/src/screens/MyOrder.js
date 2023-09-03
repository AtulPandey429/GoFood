import React, { useEffect, useState } from "react";
import Navbar from "./../components/Navbar";
import Footer from "./../components/Footer";

const MyOrder = () => {
  const [orderData, setorderData] = useState({});

  const fetchMyOrder = async () => {
    console.log(localStorage.getItem("userEmail"));
    await fetch("https://gofood-ezlb.onrender.com/api/user/myOrder", {
      // credentials: 'include',
      // Origin:"http://localhost:3000/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: localStorage.getItem("userEmail"),
      }),
    }).then(async (res) => {
      let response = await res.json();
      await setorderData(response);
    });

    // await res.map((data)=>{
    //    console.log(data)
    // })
  };

  useEffect(() => {
    fetchMyOrder();
  }, []);

  return (
    <div>
      <div>
        <Navbar />
      </div>
      <div className="container">
        <div className="row">
          {orderData !== {}
            ? Array(orderData).map((data) => {
                return data.orderData
                  ? data.orderData.order_data
                      .slice(0)
                      .reverse()
                      .map((item) => {
                        return item.map((arrayData) => {
                          return (
                            <div className=" item-container">
                              {arrayData.Order_date ? (
                                <div className=" order-info ">
                                  <div className="order-date col-12">
                                    {arrayData.Order_date}
                                  </div>
                                  <hr className="divider" />
                                </div>
                              ) : (
                                <div className=" item-card">
                                  <img
                                    src={arrayData.img}
                                    className="item-image"
                                    alt="Item"
                                  />
                                  <div className="item-details">
                                    <h5 className="item-name">
                                      {arrayData.name}
                                    </h5>
                                    <hr className="divider" />
                                    <div className="item-meta">
                                      <span className="item-quantity">
                                        {arrayData.qty}
                                      </span>
                                      <span className="item-size">
                                        {arrayData.size}
                                      </span>
                                      <div className="item-price">
                                        ₹{arrayData.price}/-
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })
                  : "";
              })
            : ""}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default MyOrder;
