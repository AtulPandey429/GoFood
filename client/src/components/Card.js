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
              width: "100%",
              height: "auto",
              maxHeight: "15rem",
              objectFit: "cover",
              objectPosition: "center",
            }}
            alt="..."
          />

          <div className="card-body bg-dark text-white">
            <h5 className="card-title">{props.name}</h5>

            <div className="container w-100">
              <div className="row">
                <div className="col">
                  <select className="w-30 bg-success ">
                    {Array.from(Array(6), (el, i) => {
                      return (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col">
                  <select className="w-30 text-bold bg-success ">
                    {priceOption.map((data) => {
                      return (
                        <option key={data} value={data}>
                          {data}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col">TotalPrice</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
