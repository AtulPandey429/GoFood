import React from "react";

const Caraosel = () => {
  return (
    <div>
      <div
        id="carouselExampleControls"
        className="carousel slide"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner " style={{ maxHeight: "650px" }}>
          <div className="carousel-caption" style={{ zIndex: 1 }}>
            <form class="d-flex">
              <input
                class="form-control me-2 p-2 "
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <button
                class="btn btn-outline-none text-white bg-success p-2"
                type="submit"
              >
                Search
              </button>
            </form>
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
  );
};

export default Caraosel;
