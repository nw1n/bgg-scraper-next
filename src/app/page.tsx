'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const baseBggUrl = 'https://api.geekdo.com/api/collections?'
const urlExample =
  'https://api.geekdo.com/api/collections?ajax=1&objectid=136955' +
  '&objecttype=thing&oneperuser=1&pageid=3&require_review=true&showcount=100&sort=review_tstamp&status=own'

const defaultParams = {
  ajax: 1,
  objectid: 136955,
  objecttype: 'thing',
  oneperuser: 1,
  pageid: 3,
  require_review: true,
  showcount: 50,
  sort: 'review_tstamp',
  status: 'own',
}

interface User {
  country: string
  city: string
  username: string
}

interface LocatedUser {
  user: User
}

// async wait function
async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let currentPageNumber = 1
let timesFailed = 0
let myDataStore: any = []

function buildUrl(gameId, pageNumber) {
  const myQueryParams = Object.assign({}, defaultParams, {
    objectid: gameId,
    pageid: pageNumber,
  })
  return `${baseBggUrl}${Object.keys(myQueryParams)
    .map((key) => `${key}=${myQueryParams[key]}`)
    .join('&')}`
}

export default function Home() {
  const [allData, setAllData] = useState<LocatedUser[]>([])
  // const [currentPageNumber, setCurrentPageNumber] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [locationInputValue, setLocationInputValue] = useState('Switzerland')
  const [gameIdInputValue, setGameIdInputValue] = useState('1066')
  const [filteredData, setFilteredData] = useState<LocatedUser[]>([])
  const [isChecked, setIsChecked] = useState(false)
  const [isGreenButtonActive, setIsGreenButtonActive] = useState(false)

  function handleCheckboxChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsChecked(event.target.checked)
  }

  const buttonRef = useRef<HTMLButtonElement>(null)

  // useEffect(() => {
  //   // if (buttonRef.current) {
  //   //   buttonRef.current.click()
  //   // }
  // }, [])

  function handleLocationInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setLocationInputValue(event.target.value)
  }

  function handleGameIdInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setGameIdInputValue(event.target.value)
  }

  function handleGreenButtonBlink() {
    setIsGreenButtonActive(true)
    setTimeout(() => {
      setIsGreenButtonActive(false)
    }, 20)
  }

  async function fetchPage() {
    if (timesFailed >= 8) {
      console.log('too many fails, stopping')
      setIsLoading(false)
      return
    }
    try {
      console.log('fetching page: ' + currentPageNumber)
      const response = await fetch(
        buildUrl(gameIdInputValue, currentPageNumber),
      )
      const respData = await response.json()
      if (respData && respData.items.length > 0) {
        handleGreenButtonBlink()
        myDataStore = [...myDataStore, ...respData.items]
        setAllData(myDataStore)
        currentPageNumber = currentPageNumber + 1
        timesFailed = 0
        await wait(0)
        fetchPage()
      } else {
        timesFailed++
        console.error('Failed Count is: ', timesFailed)
        await wait(2000)
        fetchPage()
      }
    } catch (error) {
      timesFailed++
      console.error('Error fetching data:', error)
      console.error('Failed Count is: ', timesFailed)
      await wait(2000)
      fetchPage()
    }
  }

  async function fetchAllData() {
    timesFailed = 0
    currentPageNumber = 1
    myDataStore = []
    setIsLoading(true)

    await fetchPage()
  }

  useEffect(() => {
    if (isChecked) {
      const newFilteredData = allData.filter((item: LocatedUser) => {
        const location = `${item.user.country} ${item.user.city}`
        return location.toLowerCase().includes(locationInputValue.toLowerCase())
      })
      setFilteredData(newFilteredData.reverse())
    } else {
      setFilteredData(allData.reverse())
    }
  }, [allData, locationInputValue, isChecked])

  return (
    <div className="container">
      <main>
        <h1>BGG Game owner Scraper</h1>
        <p>Enter the Location to filter</p>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
        />
        <input
          type="text"
          value={locationInputValue}
          onChange={handleLocationInputChange}
        />
        <p>Enter the Game Id</p>
        <input
          type="text"
          value={gameIdInputValue}
          onChange={handleGameIdInputChange}
        />
        <p>Click the button to start fetching data</p>
        <button ref={buttonRef} onClick={fetchAllData} disabled={isLoading}>
          {isLoading ? 'Fetching Data...' : 'Fetch Data'}
        </button>
        <span
          className={
            isGreenButtonActive
              ? 'green-button green-button--active'
              : 'green-button green-button--non-active' +
                (timesFailed > 0 ? ' green-button--red' : '')
          }
        ></span>
        <ul>
          {filteredData.map((item: LocatedUser) => (
            <li key={item.user.username} style={{ marginTop: '10px' }}>
              <div>
                {item.user.country} --- {item.user.city}{' '}
              </div>
              <a
                target="_blank"
                href={`https://boardgamegeek.com/user/${item.user.username}`}
              >
                {item.user.username}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
