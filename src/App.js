import React, { useEffect, useState } from 'react'
import Amplify, { API, graphqlOperation, Storage, Auth } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import * as d3 from 'd3'
import moment from 'moment'

import awsconfig from './aws-exports'
import { startQuery, queryByOwner } from './graphql/queries'
import { onUpdateAthenaOperation } from './graphql/subscriptions'
import codes from './country-codes'
import { drawChart } from './hexabin-helper'

Amplify.configure(awsconfig)

const App = () => {
  const [isSending, setIsSending] = useState(false)
  const [user, setUser] = useState(null)
  const [countryCode, setCountryCode] = useState('')
  const [currentQuery, setCurrentQuery] = useState(null)
  const [pastQueries, setpastQueries] = useState({ items: [] })
  const [showMenu, setShowMenu] = useState(false)

  // get current user
  useEffect(() => {
    if (user) return
    const getUser = async () => {
      const _user = await Auth.currentAuthenticatedUser()
      setUser(_user)
      console.log(JSON.stringify(_user.attributes, null, 2))
    }
    getUser()
  }, [user])

  // subscribe to athena operation
  useEffect(() => {
    if (!currentQuery || !user) return

    console.log(`Starting subscription. Current query id: ${currentQuery.id}`)
    const subscription = API.graphql(
      graphqlOperation(onUpdateAthenaOperation, {
        owner: user.attributes.sub
      })
    ).subscribe({
      next: result => {
        console.log('subscription:', result)
        const data = result.value.data.onUpdateAthenaOperation
        setpastQueries(pq => ({ items: [data, ...pq.items].slice(0, 10) }))
        setCurrentQuery(q => ({ ...q, ...data }))
        console.log('subscription data:', data)
      }
    })

    return () => {
      console.log(`Unsubscribe. Current query id: ${currentQuery.id}`)
      console.log(subscription)
      subscription.unsubscribe()
    }
  }, [currentQuery, user])

  // fetch user's previous queries
  useEffect(() => {
    if (!user) return
    console.log('Fetch user queries')

    const go = async () => {
      const result = await API.graphql(
        graphqlOperation(queryByOwner, {
          owner: user.attributes.sub,
          sortDirection: 'DESC',
          limit: 10
        })
      )
      setpastQueries(result.data.queryByOwner)
    }
    go()
  }, [user])

  // start a query
  const initStartQuery = async () => {
    if (isSending || !countryCode) return
    setIsSending(true)
    setCurrentQuery(null)
    setShowMenu(false)
    try {
      const result = await API.graphql(
        graphqlOperation(startQuery, {
          countryCode
        })
      )
      console.log(`Setting sub ID: ${result.data.startQuery.id}`)
      setIsSending(false)
      setCurrentQuery(result.data.startQuery)
    } catch (error) {
      setIsSending(false)
      console.log('querry failed ->', error)
    }
  }

  const showPastQuery = q => {
    setCountryCode('')
    setCurrentQuery(q)
    setShowMenu(false)
  }

  const signOut = () => {
    Auth.signOut()
      .then(data => console.log(data))
      .catch(err => console.log(err))
  }

  return (
    <>
      <div className="border-t-4 border-blue-300 bg-gray-800 flex justify-between items-center">
        <div className="flex px-4 items-center">
          <div className="flex-shrink-0 w-8">
            <img src="/favicon.png" className="w-8 " alt="logo" />
          </div>
          <span className=" p-4 text-gray-200 text-sm font-extrabold tracking-widest">
            Bins of population density across longitudes
          </span>
        </div>
        <div className="pr-4">
          <button
            onClick={signOut}
            className="hidden lg:inline-block p-2 px-4 rounded leading-tight text-white font-bold underline"
          >
            sign out
          </button>
          <button
            onClick={() => setShowMenu(s => !s)}
            className="inline-block lg:hidden p-2 rounded-md text-gray-100 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-menu w-6"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <QueryMenu
        {...{
          showMenu,
          countryCode,
          setCountryCode,
          disabled: isSending || !countryCode,
          initStartQuery,
          pastQueries,
          showPastQuery,
          signOut
        }}
      />
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg px-4 antialiased">
        <div className="flex mt-4">
          <div className="w-1/4 hidden lg:block">
            <QueryMenu
              {...{
                keepOn: true,
                countryCode,
                setCountryCode,
                disabled: isSending || !countryCode,
                initStartQuery,
                pastQueries,
                showPastQuery,
                signOut
              }}
            />
          </div>
          <div className="w-full lg:w-3/4">
            <section className="lg:ml-4">
              {currentQuery && currentQuery.file ? (
                <BinView {...{ currentQuery }} />
              ) : (
                <div className="py-40 text-center w-full">
                  {(isSending || currentQuery) && (
                    <div
                      className={
                        'mx-auto p-8 text-center  ' +
                        (currentQuery ? 'text-green-500' : 'text-yellow-500')
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-loader inline spinner h-12 w-12"
                      >
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line
                          x1="16.24"
                          y1="16.24"
                          x2="19.07"
                          y2="19.07"
                        ></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

const QueryMenu = ({
  keepOn = false,
  showMenu = false,
  countryCode,
  setCountryCode,
  disabled,
  initStartQuery,
  pastQueries,
  showPastQuery,
  signOut
}) => {
  const cn =
    'text-sm lg:text-base' +
    (keepOn ? '' : `mt-4 ml-4 lg:hidden ${showMenu ? 'block' : 'hidden'}`)
  return (
    <div className={cn}>
      <form className="w-full flex mb-4 items-baseline">
        <div className="relative w-40 ">
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value={''}>Select code</option>
            {codes.map(([code, name]) => (
              <option key={code} value={code}>{`${code} - ${name}`}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        <div className="ml-2">
          <button
            className={`${
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-400'
            } shadow leading-tight bg-purple-500 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded`}
            type="button"
            disabled={disabled}
            onClick={initStartQuery}
          >
            Query
          </button>
        </div>
        {keepOn ? null : (
          <div className="ml-auto">
            <button
              onClick={signOut}
              className="px-4 rounded leading-tight font-bold underline"
            >
              sign out
            </button>
          </div>
        )}
      </form>
      <div>
        <h2 className="tracking-wider font-semibold uppercase text-sm">
          Last 10 Queries
        </h2>
        <ul
          className={
            'mt-2' +
            (keepOn
              ? ''
              : ' grid grid-flow-row grid-cols-2 md:grid-cols-3 gap-2')
          }
        >
          {pastQueries.items.map(q => (
            <li className="my-1" key={q.id}>
              <button
                onClick={() => showPastQuery(q)}
                className="border-none outline-none focus:outline-none hover:bg-orange-200 rounded px-2 py-1"
              >
                <span className="tracking-wider uppercase font-semibold text-sm">
                  {q.countryCode}
                </span>
                <span className="mx-1">-</span>
                <span>{moment(q.createdAt).fromNow()}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const BinView = ({ currentQuery: query }) => {
  const [link, setLink] = useState(null)
  useEffect(() => {
    const go = async () => {
      const [level, identityId, _key] = query.file.key.split('/')
      const link = await Storage.get(_key, { level, identityId })
      setLink(link)

      const data = Object.assign(
        await d3.csv(link, ({ longitude, tot_pop, count }) => ({
          x: parseFloat(longitude),
          y: parseFloat(tot_pop),
          count: parseInt(count)
        })),
        { x: 'Longitude', y: 'Population', title: 'Pop bins by Longitude' }
      )
      drawChart(data)
    }
    go()
  }, [query])

  return (
    <div className="">
      <div className="tracking-wider font-semibold uppercase text-sm pb-1 mb-3 border-b border-gray-900">
        {query.countryCode} - ref:&nbsp;
        <a href={link} className="no-underline hover:underline text-blue-500">
          {query.file.key}
        </a>
      </div>
      <canvas width="512" height="1" style={{ display: 'none' }} />
      <svg className="chart" />
    </div>
  )
}

export default withAuthenticator(App)
