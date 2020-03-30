import * as d3 from 'd3'
import * as d3Hexbin from 'd3-hexbin'

const height = 400
const width = 720
const radius = 20
const margin = { top: 60, right: 40, bottom: 40, left: 40 }

function getX(data) {
  return d3
    .scaleLinear()
    .domain(d3.extent(data, d => d.x))
    .range([margin.left + radius, width - margin.right])
}

function getY(data) {
  return d3
    .scaleLinear()
    .domain(d3.extent(data, d => d.y))
    .rangeRound([height - margin.bottom - radius, margin.top])
}

function getColor(bins) {
  return d3
    .scaleSequential(d3.interpolateYlGnBu)
    .domain([0, d3.max(bins, d => d.length)])
}

const getxAxis = x => g =>
  g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80, ''))
    .call(g => g.select('.domain').remove())
    .call(g =>
      g
        .append('text')
        .attr('x', width - margin.right)
        .attr('y', 30)
        .attr('fill', 'currentColor')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .text('Longitude')
    )

const getyAxis = y => g =>
  g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, '1s'))
    .call(g => g.select('.domain').remove())
    .call(g =>
      g
        .append('text')
        .attr('x', -margin.left)
        .attr('y', margin.top)
        .attr('dy', '.71em')
        .attr('fill', 'currentColor')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'start')
        .text('Population')
    )

const getLegend = color => g => {
  const _width = 240

  const dataUrl = ramp(color.interpolator()).toDataURL()
  g.append('image')
    .attr('width', _width)
    .attr('height', 8)
    .attr('preserveAspectRatio', 'none')
    .attr('xlink:href', dataUrl)

  g.append('text')
    .attr('class', 'caption')
    .attr('y', -6)
    .attr('fill', '#000')
    .attr('text-anchor', 'start')
    .attr('font-weight', 'bold')
    .text('Number of samples')

  g.call(
    d3.axisBottom(d3.scaleLinear(color.domain(), [0, _width])).ticks(5, '1s')
  )
    .select('.domain')
    .remove()
}

function ramp(color, n = 512) {
  const canvas = d3.select('canvas').node()
  const context = canvas.getContext('2d')
  canvas.style.margin = '0 -14px'
  canvas.style.width = 'calc(100% + 28px)'
  canvas.style.height = '40px'
  canvas.style.imageRendering = 'pixelated'
  for (let i = 0; i < n; ++i) {
    context.fillStyle = color(i / (n - 1))
    context.fillRect(i, 0, 1, 1)
  }
  return canvas
}

function getHexbin(x, y) {
  return d3Hexbin
    .hexbin()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .radius((radius * width) / 964)
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom]
    ])
}

export function drawChart(data) {
  d3.select('.chart')
    .selectAll('*')
    .remove()
  console.log(data)
  const x = getX(data)
  const y = getY(data)
  const hexbin = getHexbin(x, y)
  const bins = hexbin(data)
  console.log(bins)
  const color = getColor(bins)
  const xAxis = getxAxis(x)
  const yAxis = getyAxis(y)
  const svg = d3.select('.chart').attr('viewBox', [0, 0, width, height])
  console.log(svg)

  svg.append('g').call(xAxis)

  svg.append('g').call(yAxis)

  svg
    .append('g')
    .attr('transform', 'translate(480,20)')
    .call(getLegend(color))

  svg
    .append('g')
    .attr('stroke', '#000')
    .attr('stroke-opacity', 0.1)
    .selectAll('path')
    .data(bins)
    .join('path')
    .attr('d', hexbin.hexagon())
    .attr('transform', d => `translate(${d.x},${d.y})`)
    // .attr('fill', d => color(d.reduce((p, c) => p + c.count, 0)))
    .attr('fill', d => color(d.length))

  return svg.node()
}
