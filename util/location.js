const axios = require("axios");
const { GOOGLE_API_KEY } = require("../config");

const getCoordinatesForAddress = (address) => {
  axios
    .get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=africa&key=AIzaSyB68v-DJwW-n3gXIEmypPTh112cnq4cu9Q`
    )
    .then((res) => {
      const data = res.data;
      if (!data || data.status === "ZERO_RESULTS") {
        return res
          .status(422)
          .send("Could not find location for the specified address");
      }

      const coordinates = data.results[0].geometry.location;
      return coordinates;
    });
};

module.exports = getCoordinatesForAddress;
