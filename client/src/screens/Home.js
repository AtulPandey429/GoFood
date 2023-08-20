import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "./../components/Card";

const Home = () => {
  const [search, setSearch] = useState("");
  const [foodItem, setFoodItem] = useState([]);
  const [foodCategory, setFoodCategory] = useState([]);

  const loadData = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/user/fooditems", {
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
      <div>
        <div
          id="carouselExampleControls"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <div className="carousel-inner " style={{ maxHeight: "650px" }}>
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
                {/* <button
                  class="btn btn-outline-none text-white bg-success p-2"
                  type="submit"
                >
                  Search
                </button> */}
              </div>
            </div>
            <div className="carousel-item active">
              <img
                src="https://source.unsplash.com/random/900×700/?maggi"
                className="d-block w-100"
                style={{
                  filter: "brightness(30%)",
                  width: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
                alt="..."
              />
            </div>
            <div className="carousel-item">
              <img
                src="https://source.unsplash.com/random/900×700/?burger"
                className="d-block w-100"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  filter: "brightness(30%)",
                  width: "100%",
                }}
                alt="..."
              />
            </div>
            <div className="carousel-item">
              <img
                src="https://source.unsplash.com/random/900×700/?pasta"
                className="d-block w-100"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  filter: "brightness(30%)",
                  width: "100%",
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
              <div key={ele._id} className="row mb-3 ">
                <div className="fs-3 m-3 ">{ele.CategoryName}</div>
                <hr />
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
                          className="col-12 col-md-6 col-lg-3 "
                        >
                          {/* Replace Card with your actual component */}
                          <Card
                            name={filterItem.name}
                            option={filterItem.options[0]}
                            imgsrc={filterItem.img}
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
