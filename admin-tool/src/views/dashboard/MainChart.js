import React, { useEffect, useRef } from 'react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
const MainChart = ({ exerciseData }) => {
  const chartRef = useRef(null)
  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
          chartRef.current.options.scales.y.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
          chartRef.current.update()
        })
      }
    })
  }, [chartRef])
  // Function to calculate count and total duration in seconds
  const calculateCountAndDuration = (data) => {
    const count = data.length
    let totalDuration = 0
    data.sort((a, b) => new Date(a.date) - new Date(b.date))
    for (let i = 1; i < data.length; i++) {
      const prevData = data[i - 1]
      const currentData = data[i]
      const duration = new Date(currentData.date) - new Date(prevData.date)
      totalDuration += duration
    }
    const totalDurationSeconds = totalDuration / 1000
    return { count, totalDurationSeconds }
  }
  // Calculate count and total duration from exerciseData
  const { totalDurationSeconds } = calculateCountAndDuration(exerciseData)
  // Generate labels in seconds based on the total duration
  const labels = Array.from({ length: Math.ceil(totalDurationSeconds) + 1 }, (_, index) => index)
  return (
    <CChartLine
      ref={chartRef}
      style={{ height: '300px', marginTop: '40px' }}
      data={{
        labels: labels,
        datasets: [
          {
            label: 'X Data',
            backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
            borderColor: getStyle('--cui-info'),
            pointHoverBackgroundColor: getStyle('--cui-info'),
            borderWidth: 2,
            data: exerciseData.map((dataPoint) => dataPoint.x), // Using x values
            fill: true,
          },
          {
            label: 'Y Data',
            backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, .1)`,
            borderColor: getStyle('--cui-success'),
            pointHoverBackgroundColor: getStyle('--cui-success'),
            borderWidth: 2,
            data: exerciseData.map((dataPoint) => dataPoint.y), // Using y values
            fill: true,
          },
          {
            label: 'Z Data',
            backgroundColor: `rgba(${getStyle('--cui-danger-rgb')}, .1)`,
            borderColor: getStyle('--cui-danger'),
            pointHoverBackgroundColor: getStyle('--cui-danger'),
            borderWidth: 2,
            data: exerciseData.map((dataPoint) => dataPoint.z), // Using z values
            fill: true,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Seconds',
            },
            grid: {
              color: getStyle('--cui-border-color-translucent'),
              drawOnChartArea: false,
            },
            ticks: {
              color: getStyle('--cui-body-color'),
              stepSize: 10, // Adjust as needed
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value',
            },
            border: {
              color: getStyle('--cui-border-color-translucent'),
            },
            grid: {
              color: getStyle('--cui-border-color-translucent'),
            },
            ticks: {
              color: getStyle('--cui-body-color'),
              stepSize: 1,
            },
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3,
          },
        },
      }}
    />
  )
}
export default MainChart
