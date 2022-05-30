let map;
//Affiche la carte centré sur la position en paramètre
function afficherMap(lat, long) {
  console.log("display the map...");

  mapboxgl.accessToken = 'pk.eyJ1IjoicGhvcmN5cy1qdWxlcyIsImEiOiJja3k4bnhsN2wxZmtqMnZveWRoMTNieWFnIn0.NJPsNkYoDfVjAh11iCqEUQ';
  map = new mapboxgl.Map({
    container: 'div_map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [long, lat], // starting position [lng, lat]
    zoom: 12 // starting zoom
  });
}

function createPoint(lat, long, p_titre, p_descritpion, img) {

  const el = document.createElement('div');

  el.style.width = `15px`;
  el.style.height = `20px`;
  el.style.backgroundSize = '100%';
  el.style.backgroundRepeat = 'no-repeat'
  el.style.backgroundImage = img;
  const popup = new mapboxgl.Popup({ offset: 25 }).setText(
    `${p_titre} : ${p_descritpion}`
  );

  new mapboxgl.Marker(el).setLngLat([long, lat]).setPopup(popup).addTo(map);
}

async function addGeoloc() {
  let url = `http://ip-api.com/json/?lang=fr`;

  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let response = JSON.parse(this.responseText);
      if (response.status !== 'success') {
        console.log('query failed: ' + response.message);
        return
      }
      createPoint(response.lat, response.lon, 'Vous êtes ici', 'Votre Géolocalisation', 'url(../assets/location_client.svg)')
      }
  };
  xhr.open('GET', url, true);
  xhr.send();

}

async function refreshParking(source, dest, fun) {
  
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = async function () {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText);
      data = fun(data);

      //Save parking info to DB
      try {
        console.log('parking.....')
        let response = await fetch(dest, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
      } catch (err) {
        console.log('Impossible de sauvegarder les places de parkings ', err); // Failed to fetch
      }
    }
  };
  xhr.open('GET', source, true);
  xhr.send();

}

//On attend que le dom soit chargé pour lancer l'event
document.addEventListener("DOMContentLoaded", async function () {
  //centrer sur Nancy
  console.log('Map');
  afficherMap(48.69211422805919, 6.184279819931009);

  console.log('geoLoc');
  //ajouter position
  let geoL = addGeoloc()

  console.log('Parking');
  //On refresh la bdd
  let urlParking = `https://geoservices.grand-nancy.org/arcgis/rest/services/public/VOIRIE_Parking/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=nom%2Cadresse%2Cplaces%2Ccapacite&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson`;
  let urlVelo = 'https://transport.data.gouv.fr/gbfs/nancy/station_information.json'
  let urlApiPark= 'http://localhost:8795/parking/save';
  let urlApiVel= 'http://localhost:8795/velos/save';
  refreshParking(urlParking, urlApiPark, function saveParking(data) {
    data =  data.features;
    data.forEach(Point => {
      let geo = Point.geometry;
      let atr = Point.attributes
      createPoint(geo.y, geo.x, `Parking : ${atr.NOM} ${atr.PLACES}/${atr.CAPACITE}`, `${atr.ADRESSE}`, 'url(../assets/location_parking.svg)');
    });
    return data
  });
  refreshParking(urlVelo, urlApiVel, function saveVelo(data) {
    data = data.data.stations
    data.forEach(Point => {
      createPoint(Point.lat, Point.lon, Point.name, `capacité : ${Point.capacity}`, 'url(../assets/bike.svg)');
    });

    return data;
  });


});


