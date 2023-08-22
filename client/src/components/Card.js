import React from "react";

const Card = (props) => {
  let option = props.option;
  let priceOption = Object.keys(option);

  return (
    <div>
      <div>
        <div className="card m-4 " style={{ width: "20rem", height: "20rem" }}>
          <img
            src={props.imgsrc}
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
            <h5 className="card-title">{props.name}</h5>

            <div className="container w-100">
              <div className="row ">
                <div className="col ">
                  <select className="text-bold btn btn-danger ">
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
                  <select className=" text-bold btn btn-danger ">
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
                   TotalPrice</div>
                <div className="col btn btn-info">Add to cart</div>

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
