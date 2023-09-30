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
  const [gameId, setGameId] = useState(136955)
  const [inputValue, setInputValue] = useState('Switzerland')
  const [filteredData, setFilteredData] = useState<LocatedUser[]>([])

  const buttonRef = useRef<HTMLButtonElement>(null)

  // useEffect(() => {
  //   // if (buttonRef.current) {
  //   //   buttonRef.current.click()
  //   // }
  // }, [])

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value)
  }

  async function fetchPage() {
    if (timesFailed > 10) {
      console.log('too many fails, stopping')
      setIsLoading(false)
      return
    }
    try {
      console.log('fetching page: ' + currentPageNumber)
      const response = await fetch(buildUrl(gameId, currentPageNumber))
      const respData = await response.json()
      if (respData && respData.items.length > 0) {
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
    setIsLoading(true)

    await fetchPage()
  }

  useEffect(() => {
    const newFilteredData = allData.filter((item: LocatedUser) => {
      const location = `${item.user.country} ${item.user.city}`
      return location.toLowerCase().includes(inputValue.toLowerCase())
    })
    setFilteredData(newFilteredData)
  }, [allData, inputValue])

  return (
    <div className="container">
      <main>
        <h1>BGG Game owner Scraper</h1>
        <p>Enter the Location to filter</p>
        <input type="text" value={inputValue} onChange={handleInputChange} />
        <p>Click the button to start fetching data</p>
        <button ref={buttonRef} onClick={fetchAllData} disabled={isLoading}>
          {isLoading ? 'Fetching Data...' : 'Fetch Data'}
        </button>
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
