'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface User {
  country: string
  city: string
  username: string
}

interface LocatedUser {
  user: User
}

function getUserUrl(userName) {
  return `https://boardgamegeek.com/user/${userName}`
}

// async wait function
async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export default function Home() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const urlExample =
    'https://api.geekdo.com/api/collections?ajax=1&objectid=14105&objecttype=thing&oneperuser=1&pageid=3&require_review=true&showcount=100&sort=review_tstamp&status=own'
  const defaultParams = {
    ajax: 1,
    objectid: 14105,
    objecttype: 'thing',
    oneperuser: 1,
    pageid: 3,
    require_review: true,
    showcount: 50,
    sort: 'review_tstamp',
    status: 'own',
  }

  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.click()
    }
  }, [])

  const fetchData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(urlExample)
      const data = await response.json()
      console.log(data.items[0])
      setData(data.items)
    } catch (error) {
      console.error('Error fetching data:', error)
    }

    setIsLoading(false)
  }

  return (
    <div className="container">
      <main>
        <h1>BGG Game owner Scraper</h1>
        <p>Click the button to start fetching data</p>
        <button ref={buttonRef} onClick={fetchData} disabled={isLoading}>
          {isLoading ? 'Fetching Data...' : 'Fetch Data'}
        </button>
        <ul>
          {data.map((item: LocatedUser) => (
            <li key={item.user.username} style={{ marginTop: '10px' }}>
              <div>
                {item.user.country} --- {item.user.city}{' '}
              </div>
              <a target="_blank" href={getUserUrl(item.user.username)}>
                {item.user.username}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
