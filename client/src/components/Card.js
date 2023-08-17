import React from "react";

const Card = () => {
  return (
    <div>
      <div>
        <div className="card m-4 " style={{ width: "20rem" ,height:'20rem' }}>
        <img
  src="https://source.unsplash.com/random/900×700/?burger"
  className="card-img-top"
  style={{ width: "100%", height: "auto",maxHeight:'15rem', objectFit: "cover", objectPosition: "center" }}
  alt="..."
/>

          <div className="card-body bg-dark text-white">
            <h5 className="card-title">Card title</h5>
            <p className="card-text">
              {" "}
              title and make up the bulk of the card's content.
            </p>
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
                    <option value="half">Half</option>
                    <option value="Full">Full</option>
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
