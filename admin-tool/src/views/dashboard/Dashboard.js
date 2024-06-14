import React, { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'

import 'react-datepicker/dist/react-datepicker.css'
import {
  CAvatar,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople } from '@coreui/icons'
import avatar2 from 'src/assets/images/avatars/2.jpg'
import MainChart from './MainChart'
// Importing react-bootstrap components
import { Modal, Button, Form, FormGroup, FormLabel, FormControl } from 'react-bootstrap'
const Dashboard = ({ patientId, date }) => {
  const [patients, setPatients] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPatientList, setShowPatientList] = useState(false)
  const [showCalender, setShowCalender] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newPatient, setNewPatient] = useState({
    First_name: '',
    Last_name: '',
    Exercise_type: '',
  })
  const [exerciseData, setExerciseData] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const graphRef = useRef(null)

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching patients:', error)
      return []
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const patientsData = await fetchPatients()
      setPatients(patientsData)
      console.log(patientsData)
    }
    fetchData()
  }, [])

  const pad = (num) => (num < 10 ? '0' + num : num)

  const formatDateTime = (date) => {
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())

    return `${year}-${month}-${day}`
  }

  const handleDateChange = async (date) => {
    setSelectedDate(date)
    console.log('selected date:', selectedDate)
    handleCloseCalender()
    const formattedDate = formatDateTime(date)
    if (selectedPatientId) {
      const data = await fetchExerciseData(selectedPatientId, formattedDate)
      setExerciseData(data)
    }
  }

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId)
    setShowCalender(true) // Show calendar when patient is clicked
  }

  useEffect(() => {
    console.log('selected patient id:', selectedPatientId)
  }, [selectedPatientId])

  const fetchExerciseType = async (exercise_id) => {
    try {
      if (!exercise_id) return null // Return null if exerciseId is not defined
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/exercises/${exercise_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch exercise type')
      }
      const data = await response.json()
      return data.Name // Return only the exercise name
    } catch (error) {
      console.error('Error fetching exercise type:', error)
      return null
    }
  }

  const fetchExerciseData = async (patientId, date) => {
    if (!patientId || !date) {
      console.error('Invalid patientId or date')
      return []
    }
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/exerciseData/${patientId}/${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch exercise data')
      }
      const data = await response.json()
      console.log('Fetched exercise data:', data)
      // Fetch exercise names for unique exercise_ids
      const uniqueExerciseIds = [...new Set(data.map((exercise) => exercise.exercise_id))]
      console.log('Unique Exercise IDs:', uniqueExerciseIds) // Log unique exercise IDs

      const exerciseNamesPromises = uniqueExerciseIds.map((exerciseId) =>
        fetchExerciseType(exerciseId),
      )
      const exerciseNames = await Promise.all(exerciseNamesPromises)
      console.log('Exercise Names:', exerciseNames) // Log fetched exercise names

      // Map exercise_id to exercise name
      const exerciseIdToNameMap = Object.fromEntries(
        uniqueExerciseIds.map((exerciseId, index) => [exerciseId, exerciseNames[index]]),
      )

      // Replace exercise_id with exercise name in data
      const detailedData = data.map((exercise) => ({
        ...exercise,
        exerciseName: exerciseIdToNameMap[exercise.exercise_id] || 'Unknown',
      }))

      console.log('Detailed Data:', detailedData) // Log detailed data with exercise names

      return detailedData
    } catch (error) {
      console.error('Error fetching exercise data:', error)
      return []
    }
  }
  const calculateCountAndDuration = (detailedData) => {
    // Create an object to store the count and duration for each exercise
    const exerciseStats = detailedData.reduce((acc, exercise) => {
      if (!acc[exercise.exerciseName]) {
        acc[exercise.exerciseName] = {
          count: 0,
          totalDuration: 0,
        }
      }

      // Increment count for the exercise
      acc[exercise.exerciseName].count += 1

      return acc
    }, {})

    // Sort data by createdAt timestamp
    detailedData.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Loop through data to calculate duration between consecutive data points
    for (let i = 1; i < detailedData.length; i++) {
      const prevData = detailedData[i - 1]
      const currentData = detailedData[i]

      // Calculate duration between current and previous data points
      const duration = new Date(currentData.date) - new Date(prevData.date)

      // Add duration to the corresponding exercise name
      exerciseStats[currentData.exerciseName].totalDuration += duration
    }

    // Convert total duration to minutes
    Object.keys(exerciseStats).forEach((exerciseName) => {
      exerciseStats[exerciseName].totalDurationMinutes =
        exerciseStats[exerciseName].totalDuration / 1000 / 60
    })

    return exerciseStats
  }

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchExerciseData(patientId, date)
      setExerciseData(data)
    }

    loadData()
  }, [patientId, date])

  const exerciseStats = calculateCountAndDuration(exerciseData)
  const handleCloseModal = () => setShowModal(false)
  const handleShowModal = () => setShowModal(true)
  // const handleShowCalender = () => setShowCalender(true)
  const handleCloseCalender = () => setShowCalender(false)
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewPatient({ ...newPatient, [name]: value })
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPatient),
      })
      if (!response.ok) {
        throw new Error('Failed to add patient')
      }
      console.log('Patient added successfully')
      const newPatientData = await response.json()
      setPatients((prevPatients) => [...prevPatients, newPatientData])
      handleCloseModal()
      setNewPatient({ First_name: '', Last_name: '', Exercise_type: '' })
    } catch (error) {
      console.error('Error adding patient:', error)
      alert('Failed to add patient')
    } finally {
      setIsLoading(false)
    }
  }
  const handleScrollToGraph = () => {
    graphRef.current.scrollIntoView({ behavior: 'smooth' })
  }
  const handleShowPatientList = () => setShowPatientList(!showPatientList)
  return (
    <>
      <CCard className="mb-4">
        <CCardBody>
          <CRow>
            <CCol sm={5}>
              <h4 id="traffic" className="card-title mb-0">
                Therapist’s view
              </h4>
            </CCol>
            <CCol sm={7} className="d-none d-md-block">
              <CButton color="primary" className="float-end me-3" onClick={handleShowPatientList}>
                Patients List
              </CButton>
              <CButton color="primary" className="float-end me-3" onClick={handleShowModal}>
                Add Patient
              </CButton>

              <Modal centered show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                  <Modal.Title>Add Patient</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form onSubmit={handleSubmit}>
                    <FormGroup className="mb-3">
                      <FormLabel>First Name</FormLabel>
                      <FormControl
                        type="text"
                        placeholder="Enter First Name"
                        name="First_name"
                        value={newPatient.First_name}
                        onChange={handleInputChange}
                        required
                      />
                    </FormGroup>
                    <FormGroup className="mb-3">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl
                        type="text"
                        placeholder="Enter Last Name"
                        name="Last_name"
                        value={newPatient.Last_name}
                        onChange={handleInputChange}
                        required
                      />
                    </FormGroup>
                    <FormGroup className="mb-3">
                      <FormLabel>Exercise Type</FormLabel>
                      <FormControl
                        type="text"
                        placeholder="Enter Exercise Type"
                        name="Exercise_type"
                        value={newPatient.Exercise_type}
                        onChange={handleInputChange}
                        required
                      />
                    </FormGroup>
                    <Button onClick={handleSubmit} variant="primary" type="submit">
                      Save
                    </Button>
                  </Form>
                </Modal.Body>
              </Modal>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>
      {showPatientList && (
        <CRow>
          <CCol xs>
            <CCard className="mb-4">
              <CCardHeader>Patients List</CCardHeader>
              <CCardBody>
                <br />
                <CTable align="middle" className="mb-0 border" hover responsive>
                  <CTableHead className="text-nowrap">
                    <CTableRow>
                      <CTableHeaderCell className="bg-body-tertiary text-center">
                        <CIcon icon={cilPeople} />
                      </CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary text-center">
                        First Name
                      </CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary text-center">
                        Last Name
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {patients.map((patient, index) => {
                      return (
                        <CTableRow key={index}>
                          <CTableDataCell className="text-center">
                            <CAvatar size="md" src={avatar2} status="success" />
                          </CTableDataCell>

                          <CTableDataCell
                            className="text-center"
                            onClick={() => handlePatientSelect(patient.id)}
                          >
                            <div>{patient.First_name}</div>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <div>{patient.Last_name}</div>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
      {/* Calendar modal */}
      <Modal centered show={showCalender} onHide={handleCloseCalender}>
        <Modal.Header closeButton>
          <Modal.Title className="text-center">Calendar</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => handleDateChange(date)}
            className="form-control float-end me-3"
          />
        </Modal.Body>
      </Modal>
      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader>Therapist’s view</CCardHeader>
            <CCardBody>
              <br />
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Exercise Type</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary ">Movements</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Duration</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary ">Raw data</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {Object.keys(exerciseStats).map((exerciseName, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>
                        <div>{exerciseName}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{exerciseStats[exerciseName].count}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>
                          {exerciseStats[exerciseName].totalDurationMinutes.toFixed(2)} minutes
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton onClick={() => handleScrollToGraph(exerciseName)}>
                          Raw data
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
              <div ref={graphRef}>
                <MainChart
                  patientId={selectedPatientId}
                  date={selectedDate}
                  exerciseData={exerciseData}
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}
export default Dashboard
