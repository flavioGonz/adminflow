import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultLeafletIcon;
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Icon } = require("leaflet");
  DefaultLeafletIcon = new Icon({
    iconUrl: markerIcon.src || markerIcon,
    iconRetinaUrl: markerIcon2x.src || markerIcon2x,
    shadowUrl: markerShadow.src || markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

export { DefaultLeafletIcon };
