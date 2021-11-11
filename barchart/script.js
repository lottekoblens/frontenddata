const margin = {top: 40, bottom: 10, left: 200, right: 20};
const width = 1100 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Creates sources <svg> element
const svg = d3.select('body').append('svg')
.attr('width', width+margin.left+margin.right)
.attr('height', height+margin.top+margin.bottom);

// Group used to enforce margin
const g = svg.append('g')
.attr('transform', `translate(${margin.left},${margin.top})`);

// Scales setup
const xscale = d3.scaleLinear().range([0, width]);
const yscale = d3.scaleBand().rangeRound([0, height]).paddingInner(0.1);

// Axis setup
const xaxis = d3.axisTop().scale(xscale);
const g_xaxis = g.append('g').attr('class','x axis');
const yaxis = d3.axisLeft().scale(yscale);
const g_yaxis = g.append('g').attr('class','y axis');

/////////////////////////

d3.json('http://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=netherlands&limit=20&api_key=f2ab12a57fcca396592451123c0c3ba1&format=json')
.then((json) => {
  data = json.tracks.track;
  // console.log(data)
  deleteUnusedData(data);
          changeKey(data);
          stringToInteger(data);
          sortDuration(data);
          return data
}).then(cleanedData => {
  let filteredData = filterDurationZero(cleanedData);
  console.table(filteredData);
  update(filteredData);
}).catch(err => {
  // if something goes wrong, the error is displayed in the console
  console.error(err);
})

const deleteUnusedData = data => {
  // use forEach to loop over array track. Then I delete the properties that I don't need
  data.forEach(track => {
      delete track.image;
      delete track.mbid;
      delete track.streamable;
  });
}

const changeKey = data => {
  // using a forEach to change the key from 'name' in the array track to 'nameSong'
  data.forEach(track => {
      Object.defineProperty(track, 'nameSong', Object.getOwnPropertyDescriptor(track, 'name'));
      // with the Object.defineProperty() method you can define a 
      // new property on an object or you can change an existing property on an object
      delete track.name;
  })
}

const stringToInteger = data => {
  data.forEach(track => {
      // convert string to Integer for listeners and duration
      track.listeners = parseInt(track.listeners);
      track.duration = parseInt(track.duration);
  })
}

const sortDuration = data => {
  // using sort to display object from highest duration to lowest duration
  // Sam Boot helped me with this code, he explained to me how it works and how I could use it
  data.sort((low, high) => high.duration - low.duration);
}

const filterDurationZero = data => {
  // remove objects whose duration equals to 0
  return data.filter(track => {
         return track.duration > 0;
      })
}

const update = filteredData => {

  filteredData.sort(function (a,b){
    return b.listeners - a.listeners;
  })
  //update the scales
  xscale.domain([0, d3.max(filteredData.map(d => +d.listeners))]) 
  // with + you return the values of listeners, so it can be used in the map()
  yscale.domain(filteredData.map((d) => d.nameSong));

  //render the axis
  g_xaxis.transition().call(xaxis);
  g_yaxis.transition().call(yaxis);


  // Render the chart with new data

  // DATA JOIN use the key argument for ensurign that the same DOM element is bound to the same data-item
  const rect = g.selectAll('rect').data(filteredData, (d) => d.nameSong).join(
    // ENTER 
    // new elements
    (enter) => {
      const rect_enter = enter.append('rect').attr('x', 0);
      rect_enter.append('title');
      return rect_enter;
    },
    // UPDATE
    // update existing elements
    (update) => update,
    // EXIT
    // elements that aren't associated with data
    (exit) => exit.remove()
  );

  // ENTER + UPDATE
  // both old and new elements
  rect.transition()
    .attr('height', yscale.bandwidth())
    .attr('width', (d) => xscale(d.listeners))
    .attr('y', (d) => yscale(d.nameSong));

  rect.select('title').text((d) => d.nameSong);
}

//interactivity
// d3.select('#filter-us-only').on('change', function() {
//   // This will be triggered when the user selects or unselects the checkbox
//   const checked = d3.select(this).property('checked');
//   if (checked === true) {
//     const filtered_data = filteredData.filter((d) => d.name === 'Creep');
//     // xscale.domain([0, d3.max(data.map(d => +d.duration))]) 
//     // yscale.domain(data.map((d) => d.name));
//     // console.log('if werkt')
//     update(filtered_data);
//   } else {
//     // xscale.domain([0, d3.max(data.map(d => +d.listeners))]) 
//     // // with + you return the values of listeners, so it can be used in the map()
//     // yscale.domain(data.map((d) => d.name));
//     // console.log('else werkt')
//     update(filteredData);
//   }

// });