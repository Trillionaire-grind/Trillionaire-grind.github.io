/* Downtown / Olde Naples public beach access points (24 locations)
   Coordinates approximate Gulf-end of each access.
   * = beach shower available */

const BEACH_ACCESS = [
  { id: "7th-ave-n", name: "7th Ave N", lat: 26.138504, lng: -81.806784, open: true, shower: true, sub: "Public access · beach shower" },
  { id: "north-lake-dr", name: "North Lake Drive", lat: 26.138335, lng: -81.806812, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "6th-ave-n", name: "6th Ave N", lat: 26.138166, lng: -81.806839, open: true, shower: true, sub: "Public access · beach shower" },
  { id: "4th-ave-n", name: "4th Ave N", lat: 26.137490, lng: -81.806949, open: false, shower: false, sub: "Temporarily closed · city project" },
  { id: "3rd-ave-n", name: "3rd Ave N", lat: 26.137152, lng: -81.807004, open: false, shower: false, sub: "Temporarily closed · city project" },
  { id: "2nd-ave-n", name: "2nd Ave N", lat: 26.136814, lng: -81.807059, open: false, shower: true, sub: "Temporarily closed · city project" },
  { id: "1st-ave-n", name: "1st Ave N", lat: 26.136476, lng: -81.807114, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "central-ave", name: "Central Ave", lat: 26.135800, lng: -81.807224, open: true, shower: false, sub: "Central cross-street · beach access" },
  { id: "1st-ave-s", name: "1st Ave S", lat: 26.135462, lng: -81.807279, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "2nd-ave-s", name: "2nd Ave S", lat: 26.135124, lng: -81.807334, open: true, shower: true, sub: "Public access · beach shower" },
  { id: "3rd-ave-s", name: "3rd Ave S", lat: 26.134786, lng: -81.807389, open: true, shower: true, sub: "Near 3rd St S · Bad Ass Coffee area" },
  { id: "4th-ave-s", name: "4th Ave S", lat: 26.134448, lng: -81.807444, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "6th-ave-s", name: "6th Ave S", lat: 26.133772, lng: -81.807554, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "7th-ave-s", name: "7th Ave S", lat: 26.133434, lng: -81.807609, open: true, shower: true, sub: "Public access · beach shower" },
  { id: "9th-ave-s", name: "9th Ave S", lat: 26.132758, lng: -81.807719, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "10th-ave-s", name: "10th Ave S", lat: 26.132420, lng: -81.807774, open: true, shower: true, sub: "Public access · beach shower" },
  { id: "11th-ave-s", name: "11th Ave S", lat: 26.132082, lng: -81.807829, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "broad-ave-s", name: "Broad Ave S", lat: 26.131899, lng: -81.807851, open: true, shower: false, sub: "Public access · restrooms" },
  { id: "15th-ave-s", name: "15th Ave S", lat: 26.130730, lng: -81.808049, open: true, shower: true, sub: "Public access · beach shower" },
  { id: "16th-ave-s", name: "16th Ave S", lat: 26.130392, lng: -81.808104, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "17th-ave-s", name: "17th Ave S", lat: 26.130054, lng: -81.808159, open: true, shower: false, sub: "Public access · Olde Naples" },
  { id: "18th-ave-s", name: "18th Ave S", lat: 26.129716, lng: -81.808214, open: true, shower: true, sub: "Public access · beach shower" },
  { id: "32nd-ave-s", name: "32nd Ave S", lat: 26.124984, lng: -81.808544, open: true, shower: false, sub: "Public access · south Olde Naples" },
  { id: "33rd-ave-s", name: "33rd Ave S", lat: 26.124646, lng: -81.808599, open: true, shower: true, sub: "Public access · beach shower" }
];
