const margin = { top: 40, bottom: 10, left: 200, right: 20 };
const width = 1100 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// create sources svg element
const svg = d3.select('body').append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom);

// group used to enforce margin
const g = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// scales
const xscale = d3.scaleLinear().range([0, width]);
const yscale = d3.scaleBand().rangeRound([0, height]).paddingInner(0.1);

// axis
const xaxis = d3.axisTop().scale(xscale);
const g_xaxis = g.append('g').attr('class', 'x axis');
const yaxis = d3.axisLeft().scale(yscale);
const g_yaxis = g.append('g').attr('class', 'y axis');

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
    filteredData = filterDurationZero(cleanedData);
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
  data.sort((low, high) => high.duration - low.duration);
}

const filterDurationZero = data => {
  // remove objects whose duration equals to 0
  return data.filter(track => {
    return track.duration > 0;
  })
}

// function to show amount of listeners on xscale
const update = (filteredData, type) => {
  let hetType = type;

  filteredData.sort(function (a, b) {
    if (type === 'listeners') {
      return b.listeners - a.listeners
    } else {
      return b.duration - a.duration
    }
  })

  //update the scales
  xscale.domain([0, d3.max(filteredData.map(d => {
    if (type === 'listeners') {
      return +d.listeners;
    } else {
      return +d.duration;
    }
  }))])

  // with + you return the values of listeners, so it can be used in the map()
  yscale.domain(filteredData.map((d) => d.nameSong));

  //render the axis
  g_xaxis.transition().duration(800).call(xaxis);
  g_yaxis.transition().duration(800).call(yaxis);


  // render the chart with new data
  const rect = g.selectAll('rect').data(filteredData, (d) => d.nameSong).join(
    // entering new elements
    (enter) => {
      const rect_enter = enter.append('rect').attr('x', 0);
      rect_enter.append('title');
      return rect_enter;
    },
    // update
    (update) => update,
    // exit to delete the elements that have no data
    (exit) => exit.remove()
  )
    .on('mouseover', (d, data) => {
      onMouseOver(d, data, 'listeners')
    })
    .on('mousemove', onMouseOver)
    .on('mouseout', onMouseOut);

    rect
    .attr('height', yscale.bandwidth())
    .transition()
    .duration(800)
    .attr('y', (d) => yscale(d.nameSong))

  if (type === 'listeners') {
    rect
      .attr('width', (d) => xscale(d.listeners))
  } else {
    rect
      .attr('width', (d) => xscale(d.duration))
  }

}

function onMouseOver(d, data, type) {
  // d is the data of the mouse
  // clientX and clientY are the position of the mouse
  const xPosition = d.clientX
  const yPosition = d.clientY

  console.log('onmouseover', type)

  let toolTipValue
  toolTipValue = data[selection]
  d3.select(d.target).attr('class', 'highlight')
  d3.select('#tooltip').classed('hidden', false)
  d3.select('#tooltip')
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
  

  if (selection === 'listeners') {
    d3.select('#value').text('Aantal listeners:' + toolTipValue)
  } else {
    d3.select('#value').text('Duration van nummer:' + toolTipValue)
  }
  d3.select('#name').text(data.nameSong)
}

function onMouseOut(d, i) {
  d3.select(this).attr('class', 'bar')
  d3.select('#tooltip').classed('hidden', true)
}

let selection = 'listeners'
d3.selectAll('#filter').on('change', function () {
  const checked = d3.select(this).property('checked')
  if (checked === true) {
    if (d3.select(this).node().value === 'listeners') {
      selection = 'listeners'
      update(filteredData, 'listeners')
    }
    if (d3.select(this).node().value === 'duration') {
      selection = 'duration'
      // getDuration(filteredData)
      update(filteredData, 'duration')
      console.log(filteredData)
    }
  } else {
    update(filteredData, 'duration')
  }
})