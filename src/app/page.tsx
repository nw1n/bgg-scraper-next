'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const baseBggUrl = 'https://api.geekdo.com/api/collections?'
const urlExample =
  'https://api.geekdo.com/api/collections?ajax=1&objectid=136955' +
  '&objecttype=thing&oneperuser=1&pageid=3&require_review=true&showcount=100&sort=review_tstamp&status=own'
const xmlGameUrlBase = 'https://boardgamegeek.com/xmlapi2/thing?id='

const defaultParams = {
  ajax: 1,
  objectid: '136955',
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
let isFetching = false

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
  const defaultGameId = defaultParams.objectid

  const [allData, setAllData] = useState<LocatedUser[]>([])
  // const [currentPageNumber, setCurrentPageNumber] = useState(1)
  const [isLoadingState, setIsLoadingState] = useState(false)
  const [locationInputValue, setLocationInputValue] = useState('Switzerland')
  const [gameIdInputValue, setGameIdInputValue] = useState(defaultGameId)
  const [filteredData, setFilteredData] = useState<LocatedUser[]>([])
  const [isChecked, setIsChecked] = useState(false)
  const [isGreenButtonActive, setIsGreenButtonActive] = useState(false)
  const [lastLogMessage, setLastLogMessage] = useState('')
  const [gameTitle, setGameTitle] = useState('')

  function handleCheckboxChange(event: React.ChangeEvent<HTMLInputElement>) {
    log('filter toggled')
    setIsChecked(event.target.checked)
  }

  const buttonRef = useRef<HTMLButtonElement>(null)
  const stopButtonRef = useRef<HTMLButtonElement>(null)

  function handleLocationInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setLocationInputValue(event.target.value)
  }

  function handleGameIdInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setGameIdInputValue(event.target.value)
  }

  function handleStopButtonClick() {
    log('stop button clicked')
    isFetching = false
    setIsLoadingState(false)
  }

  function handleGreenButtonBlink() {
    setIsGreenButtonActive(true)
    setTimeout(() => {
      setIsGreenButtonActive(false)
    }, 20)
  }

  function log(logMessage: any) {
    console.log(logMessage)
    if (logMessage && typeof logMessage === 'string') {
      setLastLogMessage(logMessage)
    }
  }

  async function fetchPage() {
    if (!isFetching) {
      log('isFetching is false, stopping')
      setIsLoadingState(false)
      return
    }
    if (timesFailed >= 8) {
      log('too many fails, stopping')
      isFetching = false
      setIsLoadingState(false)
      return
    }
    try {
      log('fetching page: ' + currentPageNumber)
      const response = await fetch(
        buildUrl(gameIdInputValue, currentPageNumber),
      )
      const respData = await response.json()
      if (respData && respData.items.length > 0) {
        handleGreenButtonBlink()
        console.log(respData.items[0])
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

  async function fetchXmlDataForGame() {
    try {
      const response = await fetch(xmlGameUrlBase + gameIdInputValue)
      // parse xml data
      const respData = await response.text()
      // find usbstring in xml
      const myRawString =
        respData.match(
          /<name type="primary" sortindex="1" value="(.*?)"/,
        )?.[1] || ''
      const myString = decodeHtmlEntities(myRawString)
      log('Setting Game Title to: ' + myString)
      setGameTitle(myString)
    } catch (error) {
      log('Setting Game Title to set game title.')
      console.error('Error fetching xml data:', error)
    }
  }

  function decodeHtmlEntities(html: string) {
    const parser = new DOMParser()
    const decodedHtml = parser.parseFromString(html, 'text/html')
      .documentElement.textContent
    if (decodedHtml) {
      return decodedHtml
    }
    return ''
  }

  async function fetchAllData() {
    timesFailed = 0
    currentPageNumber = 1
    myDataStore = []
    isFetching = true
    setIsLoadingState(true)

    await fetchXmlDataForGame()

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
        <Button>Click me</Button>
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
        <button
          ref={buttonRef}
          onClick={fetchAllData}
          disabled={isLoadingState}
        >
          {isLoadingState ? 'Fetching Data...' : 'Fetch Data'}
        </button>
        <button
          ref={stopButtonRef}
          onClick={handleStopButtonClick}
          disabled={!isLoadingState}
        >
          Stop
        </button>
        <div className="log-window">LOG: {lastLogMessage}</div>
        <span
          className={
            isGreenButtonActive
              ? 'green-button green-button--active'
              : 'green-button green-button--non-active' +
                (timesFailed > 0 ? ' green-button--red' : '')
          }
        ></span>
        <h4>Game Title: {gameTitle}</h4>
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
