// for this code I used the tutorial of S. Gartzl https://www.sgratzl.com/d3tutorial/
// I changed the code a lot after I followed the tutorial to make it work for my data and change a lot of other stuff
// but I used it as an example 

const margin = { top: 40, bottom: 10, left: 200, right: 20 }
const width = 1100 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom

// create sources svg element
const svg = d3.select('body').append('svg') // body is selected and svg is added to the body
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)

const g = svg.append('g') // group used to enforce margin
  .attr('transform', `translate(${margin.left},${margin.top})`)

// scales
const xscale = d3.scaleLinear().range([0, width]) // scaleLinear makes the steps between the values on the xscale equal
const yscale = d3.scaleBand().rangeRound([0, height]).paddingInner(0.1)
// paddingInner is for the space between the bars

// axis
const xaxis = d3.axisTop().scale(xscale) // the xaxis will be displayed on the top
const g_xaxis = g.append('g').attr('class', 'x axis')
const yaxis = d3.axisLeft().scale(yscale) // the yaxis will be displayed on the left
const g_yaxis = g.append('g').attr('class', 'y axis')

/////////////////////////

d3.json('https://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=netherlands&limit=20&api_key=f2ab12a57fcca396592451123c0c3ba1&format=json')
  .then((json) => {
    data = json.tracks.track
    deleteUnusedData(data)
    changeKey(data)
    stringToInteger(data)
    sortDuration(data)
    return data
  }).then(cleanedData => {
    filteredData = filterDurationZero(cleanedData)
    update(filteredData)
  }).catch(err => {
    console.error(err) // if something goes wrong, the error is displayed in the console
  })


// data cleaning

const deleteUnusedData = data => {
  // use forEach to loop over array track. Then I delete the properties that I don't need
  data.forEach(track => {
    delete track.image
    delete track.mbid
    delete track.streamable
  })
}

const changeKey = data => {
  // using a forEach to change the key from 'name' in the array track to 'nameSong'
  data.forEach(track => {
    Object.defineProperty(track, 'nameSong', Object.getOwnPropertyDescriptor(track, 'name'))
    // with the Object.defineProperty() method you can define a 
    // new property on an object or you can change an existing property on an object
    delete track.name
  })
}

const stringToInteger = data => {
  data.forEach(track => {
    track.listeners = parseInt(track.listeners) // convert string to Integer for listeners and duration
    track.duration = parseInt(track.duration)
  })
}

const sortDuration = data => {
  data.sort((low, high) => high.duration - low.duration) // using sort to display object from highest duration to lowest duration
}

const filterDurationZero = data => {
  return data.filter(track => {
    return track.duration > 0 // remove objects whose duration equals to 0
  })
}

// making bar chart

// with this function the other functions will be called, but in this way the function updateRect does not dependent of the second one
const update = (filteredData, type) => {
  sortData(filteredData, type)
  updateXscale(filteredData, type)
  updateRect(filteredData, type)

  // render the axis
  // when the axis are rendered there is a transition that takes 800 milliseconds
  g_xaxis.transition().duration(800).call(xaxis)
  g_yaxis.transition().duration(800).call(yaxis)
}


// function to sort the data from high to low
const sortData = (filteredData, type) => {
  filteredData.sort( (a, b) => {
    if (type === 'listeners') {
      return b.listeners - a.listeners
    } else {
      return b.duration - a.duration
    }
  })
}

// function to show amount of listeners on xscale
const updateXscale = (filteredData, type) => { //update the scales
  xscale.domain([0, d3.max(filteredData.map(d => {
    // with the if else, the right data will be show on the xscale
    // when type is listeners, the listeners will be show on the xscale
    if (type === 'listeners') {
      return +d.listeners
    } else {
      return +d.duration  // with + you return the values of listeners, so it can be used in the map()
    }
  }))])
  yscale.domain(filteredData.map((d) => d.nameSong)) // on the yscale the name of the song will be displayed
}

const updateRect = (filteredData, type) => {
  // render the chart with new data
  const rect = g.selectAll('rect').data(filteredData, (d) => d.nameSong).join(
    (enter) => { // entering new elements
      const rect_enter = enter.append('rect').attr('x', 0)
      rect_enter.append('title')
      return rect_enter
    }
  ) // on mouseouver, mousemove, mouseout the functions will be called
  .on('mouseover', onMouseOver)
  .on('mousemove', onMouseOver)
  .on('mouseout', onMouseOut)
  
rect // set the height and width of the rectangles and added a transition
  .attr('height', yscale.bandwidth())
  .transition()
  .duration(800)
  .attr('y', (d) => yscale(d.nameSong))

// when type is listeners the listeners will be displayed on the xscale
if (type === 'listeners') {
  rect
    .attr('width', (d) => xscale(d.listeners))
} 
// otherwise the duration will be displayed on the xscale
else {
  rect
    .attr('width', (d) => xscale(d.duration))
}
}

const onMouseOver = (d, data) => {
  // d is the data of the mouse
  const xPosition = d.clientX // clientX and clientY are the position of the mouse
  const yPosition = d.clientY

  let toolTipValue
  toolTipValue = data[selection] // set toolTipValue to the selection
  d3.select(d.target).attr('class', 'highlight') // class is set to highlight
  d3.select('#tooltip').classed('hidden', false) // class hidden is set to false, so the class is not used
  d3.select('#tooltip')
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
  d3.select('#name').text('Het nummer ' + data.nameSong) // set text for tooltip 
  if (selection === 'listeners') {
    d3.select('#value').text('heeft ' + toolTipValue + ' luisteraars.')
  } else {
    d3.select('#value').text('duurt: ' + toolTipValue + ' seconden.')
  }
}

const onMouseOut = (d) => {
  d3.select(d.target).attr('class', 'bar') // with d.target the rect.bar class will be set to bar
  d3.select('#tooltip').classed('hidden', true) // the class hidden will be set to true
}

let selection = 'duration' // default selection is set to duration
// when radiobuttons are being checked this function will execute
d3.selectAll('#filter').on('change',  (i) => {
  const target = i.target
  const checked = d3.select(target).property('checked')
  if (checked === true) {
    // when the radiobutton of listeners is selected, the update function will be called with a type of listeners
    if (d3.select(target).node().value === 'listeners') {
      selection = 'listeners'
      update(filteredData, 'listeners') // function update will be called with a type of listeners
    }
    // when the radiobutton of duration is selected, the update function will be called with a type of duration
    else if (d3.select(target).node().value === 'duration') {
      selection = 'duration'
      update(filteredData, 'duration') // function update will be called with a type of duration
    }
  } 
  // when there is no radiobutton being selected, the update function will be called with a type of duration
  else {
    update(filteredData, 'duration')
  }
})