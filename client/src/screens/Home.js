import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "./../components/Card";
import "../index.css";

const Home = () => {
  const [search, setSearch] = useState("");
  const [foodItem, setFoodItem] = useState([]);
  const [foodCategory, setFoodCategory] = useState([]);

  const loadData = async () => {
    try {
      const response = await fetch("https://gofood-ezlb.onrender.com/api/user/fooditems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Request failed with status: " + response.status);
      }

      const data = await response.json();
      setFoodItem(data[0]);
      setFoodCategory(data[1]);

      // Update state here
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div>
        <Navbar />
      </div>
      <div className="car-container">
        <div
          id="carouselExampleControls"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <div
            className="carousel-inner m-auto "
            style={{ maxHeight: "400px" }}
          >
            <div className="carousel-caption" style={{ zIndex: 1 }}>
              <div class="d-flex justify-content-center">
                <input
                  class="form-control me-2 p-2 "
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="carousel-item active">
            <img src="https://source.unsplash.com/random/900x700/?burger" className="d-block w-100  " style={{ filter: "brightness(30%)" }} alt="..." />
            </div>
            <div className="carousel-item">
              <img
                src="https://media.istockphoto.com/id/1398630614/photo/bacon-cheeseburger-on-a-toasted-bun.jpg?s=1024x1024&w=is&k=20&c=rXM2ry9bme764bKBGagwq4jYdjr7q98UiJLyHrl6BUU="
                className="d-block w-100"
                style={{
                  filter: "brightness(30%)",
                  width: "100%",
                  objectFit: "fill",
                  objectPosition: "center",
                }}
                alt="..."
              />
            </div>
            <div className="carousel-item">
              <img
                src="https://media.istockphoto.com/id/1403973419/photo/table-top-of-food-spread-on-table.jpg?s=1024x1024&w=is&k=20&c=MUzQiekBfW_aJnHk-Q0oGwyJyz6K1XUwq-_UZCf1tMM="
                className="d-block w-100"
                style={{
                  filter: "brightness(30%)",
                  width: "100%",
                  objectFit: "fill",
                  objectPosition: "center",
                }}
                alt="..."
              />
            </div>
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleControls"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleControls"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </div>

      <div className="container">
        {foodCategory.length !== 0
          ? foodCategory.map((ele) => (
              <div key={ele._id} className="row  ">
                <div className="fs-3 m-2 text-white ">{ele.CategoryName}</div>
                <hr className="text-white" />

                {foodItem.length !== 0
                  ? foodItem
                      .filter(
                        (item) =>
                          item.CategoryName === ele.CategoryName &&
                          item.name
                            .toLowerCase()
                            .includes(search.toLocaleLowerCase())
                      )
                      .map((filterItem) => (
                        <div
                          key={filterItem._id}
                          className="
                  
                          m-lg-4
                          m-md-5

                          col-12 col-md-4
                           col-lg-3 "
                        >
                          {/* Replace Card with your actual component */}
                          <Card
                            foodItem={filterItem}
                            option={filterItem.options[0]}
                            img={filterItem.img}
                          />
                        </div>
                      ))
                  : ""}
              </div>
            ))
          : ""}
      </div>

      <div className="container">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
