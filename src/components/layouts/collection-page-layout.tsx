import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'react-markdown'
import InstructorProfile from 'components/pages/courses/instructor-profile'
import PlayIcon from 'components/pages/courses/play-icon'
import getDependencies from 'data/courseDependencies'
import {get, first, filter, isEmpty, take} from 'lodash'
import {NextSeo} from 'next-seo'
import removeMarkdown from 'remove-markdown'
import {track} from 'utils/analytics'
import FolderDownloadIcon from '../icons/folder-download'
import RSSIcon from '../icons/rss'
import {convertTimeWithTitles} from 'utils/time-utils'
import ClockIcon from '../icons/clock'
import {LessonResource} from 'types'
import BookmarkIcon from '../icons/bookmark'
import axios from 'utils/configured-axios'
import friendlyTime from 'friendly-time'
import LearnerRatings from '../pages/courses/learner-ratings'
import FiveStars from '../five-stars'
import CommunityResource from 'components/community-resource'
import {parse} from 'date-fns'
import CheckIcon from '../icons/check-icon'
import TagList from './tag-list'
import {CardHorizontal} from '../pages/home'
import {useTheme} from 'next-themes'

type CoursePageLayoutProps = {
  lessons: any
  course: any
  ogImageUrl: string
}

type CollectionResource = {
  title: string
  duration: number
  instructor: {
    full_name: string
  }
  square_cover_url: string
  image_url: string
  path: string
  slug: string
  description: string
}

const logCollectionResource = (collection: CollectionResource) => {
  if (typeof window !== 'undefined') {
    const {
      title,
      duration,
      instructor,
      square_cover_url,
      image_url,
      path,
      slug,
      description,
    } = collection
    const image = square_cover_url || image_url
    const formattedDuration = convertTimeWithTitles(duration)
    const byline = `${
      instructor?.full_name && `${instructor.full_name}・`
    }${formattedDuration}・Course`

    console.debug({
      title,
      byline,
      ...(!!image && {image}),
      path,
      slug,
      description,
    })
  }
}

const Duration: React.FunctionComponent<{duration: string}> = ({duration}) => (
  <div className="flex flex-row items-center">
    <ClockIcon className="w-4 h-4 mr-1 opacity-60" />
    <span>{duration}</span>
  </div>
)

const UpdatedAt: React.FunctionComponent<{date: string}> = ({date}) => (
  <div>Updated {date}</div>
)

const StarsRating: React.FunctionComponent<{
  rating: number
}> = ({rating}) => (
  <div className="flex items-center">
    <FiveStars rating={rating} />
    <span className="ml-1 font-semibold leading-tight">
      {rating.toFixed(1)}
    </span>
  </div>
)

const PeopleCompleted: React.FunctionComponent<{count: number}> = ({count}) => (
  <div className="flex items-center flex-nowrap">
    <div className="font-semibold mr-1">{count}</div>
    <div className="whitespace-nowrap">people completed</div>
  </div>
)

const CollectionPageLayout: React.FunctionComponent<CoursePageLayoutProps> = ({
  lessons,
  course,
  ogImageUrl,
}) => {
  const courseDependencies: any = getDependencies(course.slug)
  const [isFavorite, setIsFavorite] = React.useState(false)

  const defaultPairWithResources: any[] = take(
    [
      {
        title: 'Introduction to Cloudflare Workers',
        byline: 'Kristian Freeman・36m・Course',
        image:
          'https://d2eip9sf3oo6c2.cloudfront.net/playlists/square_covers/000/418/892/thumb/EGH_IntroCloudFlareWorkers_Final.png',
        path: '/playlists/introduction-to-cloudflare-workers-5aa3',
        slug: 'introduction-to-cloudflare-workers-5aa3',
        description:
          "Become familiar with the Workers CLI `wrangler` that we will use to bootstrap our Worker project. From there you'll understand how a Worker receives and returns requests/Responses. We will also build this serverless function locally for development and deploy it to a custom domain.",
      },
      {
        title: 'Create an eCommerce Store with Next.js and Stripe Checkout',
        byline: 'Colby Fayock・1h 4m・Course',
        image:
          'https://d2eip9sf3oo6c2.cloudfront.net/playlists/square_covers/000/412/781/thumb/ecommerce-stripe-next.png',
        path:
          '/playlists/create-an-ecommerce-store-with-next-js-and-stripe-checkout-562c',
        slug: 'create-an-ecommerce-store-with-next-js-and-stripe-checkout-562c',
        description: `This is a practical project based look at building a working e-commerce store
        using modern tools and APIs. Excellent for a weekend side-project for your [developer project portfolio](https://joelhooks.com/developer-portfolio)`,
      },
      {
        title: 'Practical Git for Everyday Professional Use',
        byline: 'Trevor Miller・1h・Course',
        image:
          'https://d2eip9sf3oo6c2.cloudfront.net/series/square_covers/000/000/050/thumb/egghead-practical-git-course.png',
        path: '/courses/practical-git-for-everyday-professional-use',
        slug: 'practical-git-for-everyday-professional-use',
        description: `[git](/q/git) is a critical component in the modern web developers tool box. This course
         is a solid introduction and goes beyond the basics with some more advanced git commands
         you are sure to find useful.`,
      },
      {
        title: 'Build an App with the AWS Cloud Development Kit',
        byline: 'Tomasz Łakomy・1h 4m・Course',
        image:
          'https://d2eip9sf3oo6c2.cloudfront.net/series/square_covers/000/000/450/thumb/EGH_AWS-TS.png',
        path: '/courses/build-an-app-with-the-aws-cloud-development-kit',
        slug: 'build-an-app-with-the-aws-cloud-development-kit',
        description:
          "Tomasz Łakomy will guide you through using TypeScript to complete the lifecycle of an application powered by AWS CDK. You'll see how to start a project, develop it locally, deploy it globally, then tear it all down when you're done. Excellent kick start for your next side project or your developer portfolio.",
      },
    ].filter((resource) => {
      return resource.slug !== course.slug
    }),
    3,
  )

  const {
    topics,
    illustrator,
    dependencies,
    freshness,
    pairWithResources = defaultPairWithResources,
    courseProject,
    quickFacts,
    essentialQuestions,
  } = courseDependencies

  const {
    title,
    image_thumb_url,
    square_cover_480_url,
    instructor,
    average_rating_out_of_5,
    watched_count,
    description,
    rss_url,
    download_url,
    toggle_favorite_url,
    duration,
    collection_progress,
    favorited,
    updated_at,
    state,
    path,
    tags = [],
  } = course

  const podcast = first(
    course?.items?.filter((item: any) => item.type === 'podcast'),
  )

  logCollectionResource(course)

  const courseTags = tags.map((tag: any) => {
    const version = get(dependencies, tag.name)
    return {
      ...tag,
      ...(!!version && {version}),
    }
  })

  React.useEffect(() => {
    setIsFavorite(favorited)
  }, [favorited])

  const completedLessonSlugs = get(
    collection_progress,
    'completed_lessons',
    [],
  ).map((lesson: LessonResource) => lesson.slug)

  const {full_name, avatar_64_url, slug: instructor_slug, bio_short, twitter} =
    instructor || {}

  const image_url = square_cover_480_url || image_thumb_url

  const imageIsTag = image_url.includes('tags/image')

  const playlists = filter(course.items, {type: 'playlist'}) || []

  const playlistLessons = playlists.reduce((acc, playlist) => {
    const lessons = playlist?.lessons ?? []
    return [...acc, ...lessons]
  }, [])

  // this is a pretty sloppy approach to fetching the next lesson
  // via playlist lessons, but those are for nested playlists in
  // playlists
  const nextLesson: any = isEmpty(playlistLessons)
    ? first(
        lessons.filter(
          (lesson: LessonResource) =>
            !completedLessonSlugs.includes(lesson.slug),
        ),
      )
    : first(
        playlistLessons.filter(
          (lesson: LessonResource) =>
            !completedLessonSlugs.includes(lesson.slug),
        ),
      )

  const PlayButton: React.FunctionComponent<{lesson: LessonResource}> = ({
    lesson,
  }) => {
    const isContinuing =
      lesson && lesson !== first(lessons) && lesson !== first(playlistLessons)
    return lesson ? (
      <Link href={lesson.path}>
        <a
          onClick={() => {
            track(
              `clicked ${isContinuing ? 'continue' : 'start'} watching course`,
              {
                course: course.slug,
              },
            )
          }}
          className="inline-flex justify-center items-center px-6 py-4 font-semibold rounded-md bg-blue-600 text-white transition-all hover:bg-blue-700 ease-in-out duration-200"
        >
          <PlayIcon className="text-blue-100 mr-2" />
          {isContinuing ? 'Continue' : 'Start'} Watching
        </a>
      </Link>
    ) : null
  }

  return (
    <>
      <NextSeo
        description={removeMarkdown(description)}
        canonical={`${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}${path}`}
        title={title}
        titleTemplate={'%s | egghead.io'}
        twitter={{
          handle: instructor?.twitter ?? `@eggheadio`,
          site: `@eggheadio`,
          cardType: 'summary_large_image',
        }}
        openGraph={{
          title,
          url: `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}${path}`,
          description: removeMarkdown(description),
          site_name: 'egghead',
          images: [
            {
              url: ogImageUrl,
            },
          ],
        }}
      />
      <div className="max-w-screen-xl mx-auto sm:pb-16 pb-8 dark:text-gray-100">
        {state === 'retired' && (
          <div className="w-full text-lg bg-orange-100 text-orange-800 p-3 rounded-md border border-orange-900 border-opacity-20">
            ⚠️ This course has been retired and might contain outdated
            information.
          </div>
        )}
        <div className="mt-5 grid md:grid-cols-5 grid-cols-1 md:gap-16 gap-5 rounded-md w-full left-0 mb-4">
          <div className="md:col-span-3 md:row-start-auto flex flex-col h-full max-w-screen-2xl w-full mx-auto">
            <header>
              {image_url && (
                <div className="md:hidden flex items-center justify-center">
                  <div>
                    <Image
                      src={image_url}
                      alt={`illustration for ${title}`}
                      height={imageIsTag ? 100 : 200}
                      width={imageIsTag ? 100 : 200}
                      quality={100}
                    />
                  </div>
                </div>
              )}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight md:text-left text-center mt-4 md:mt-0">
                {title}
              </h1>
              <div className="mt-4 flex flex-col items-center md:items-start">
                {instructor && (
                  <InstructorProfile
                    name={full_name}
                    avatar_url={avatar_64_url}
                    url={instructor_slug}
                    bio_short={bio_short}
                    twitter={twitter}
                  />
                )}
                <div className="flex items-center flex-col md:flex-row flex-wrap">
                  <TagList tags={courseTags} courseSlug={course.slug} />
                  <div className="flex items-center md:justify-start justify-center md:mr-4 mt-4">
                    {duration && (
                      <div className="mr-4">
                        <Duration duration={convertTimeWithTitles(duration)} />
                      </div>
                    )}
                    {updated_at && (
                      <UpdatedAt date={friendlyTime(new Date(updated_at))} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center md:justify-start justify-center mt-4 space-y-4 md:space-y-0 md:space-x-6 w-full">
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:flex-nowrap">
                  {average_rating_out_of_5 > 0 && (
                    <StarsRating rating={average_rating_out_of_5} />
                  )}
                  {watched_count > 0 && (
                    <PeopleCompleted count={watched_count} />
                  )}
                </div>
              </div>

              <div className="dark:text-gray-900 flex items-center md:justify-start justify-center mt-4 space-x-2">
                {toggle_favorite_url ? (
                  <button
                    onClick={() => {
                      track(
                        `clicked ${isFavorite ? 'remove' : 'add'} bookmark`,
                        {
                          course: course.slug,
                        },
                      )
                      axios.post(toggle_favorite_url)
                      setIsFavorite(!isFavorite)
                    }}
                  >
                    <div className="dark:text-gray-900 flex flex-row items-center border px-2 py-1 rounded hover:bg-gray-200 bg-gray-100 transition-colors text-sm xs:text-base">
                      <BookmarkIcon
                        className={`w-4 h-4 mr-1`}
                        fill={isFavorite}
                      />{' '}
                      Bookmark
                    </div>
                  </button>
                ) : (
                  <div className="dark:text-gray-900 flex flex-row items-center border px-2 py-1 rounded bg-gray-100 opacity-30">
                    <BookmarkIcon className="w-4 h-4 mr-1" /> Bookmark
                  </div>
                )}
                {download_url ? (
                  <Link href={download_url}>
                    <a
                      onClick={() => {
                        track(`clicked download course`, {
                          course: course.slug,
                        })
                      }}
                    >
                      <div className="dark:text-gray-900 flex flex-row items-center border px-2 py-1 rounded hover:bg-gray-200 bg-gray-100 transition-colors text-sm xs:text-base">
                        <FolderDownloadIcon className="w-4 h-4 mr-1" /> Download
                      </div>
                    </a>
                  </Link>
                ) : (
                  <div className="flex flex-row items-center border px-2 py-1 rounded bg-gray-100 opacity-30">
                    <FolderDownloadIcon className="w-4 h-4 mr-1" /> Download
                  </div>
                )}
                {rss_url ? (
                  <Link href={rss_url}>
                    <a
                      onClick={() => {
                        track(`clicked rss feed link`, {
                          course: course.slug,
                        })
                      }}
                    >
                      <div className="flex flex-row items-center border px-2 py-1 rounded hover:bg-gray-200 bg-gray-100 transition-colors text-sm xs:text-base">
                        <RSSIcon className="w-4 h-4 mr-1" /> RSS
                      </div>
                    </a>
                  </Link>
                ) : (
                  <div className="flex flex-row items-center border px-2 py-1 rounded bg-gray-100 opacity-30">
                    <RSSIcon className="w-4 h-4 mr-1" /> RSS
                  </div>
                )}
              </div>

              <div className="md:hidden flex items-center justify-center w-full mt-5">
                <PlayButton lesson={nextLesson} />
              </div>

              <Markdown className="prose dark:prose-dark md:prose-lg md:dark:prose-lg-dark text-gray-900 dark:text-gray-100 mt-6 mb-6">
                {description}
              </Markdown>

              <div className="pt-5 md:hidden block">
                <Fresh freshness={freshness} />

                <CourseProjectCard courseProject={courseProject} />

                {get(course, 'free_forever') && (
                  <div className="p-3 border border-gray-100 rounded-md bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                    <CommunityResource type="course" />
                  </div>
                )}

                {illustrator && (
                  <div className="w-full py-6">
                    <h4 className="font-semibold">Credits</h4>
                    <span className="text-sm">
                      {illustrator?.name} (illustration)
                    </span>
                  </div>
                )}
              </div>
              {!isEmpty(podcast) && (
                <CoursePodcast podcast={podcast} instructorName={full_name} />
              )}
              {topics && (
                <div className="mt-8 border border-gray-100 dark:border-gray-700 rounded-md p-5">
                  <h2 className="text-lg font-semibold mb-3">
                    What you'll learn
                  </h2>
                  <div className="prose dark:prose-dark">
                    <ul className="grid md:grid-cols-2 grid-cols-1 md:gap-x-5">
                      {topics?.map((topic: string) => (
                        <li
                          key={topic}
                          className="text-gray-900 dark:text-gray-100 leading-6"
                        >
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {quickFacts && (
                <div className="mt-8 border border-gray-100 dark:border-gray-700 rounded-md p-5">
                  <h2 className="text-lg font-semibold mb-3">Quick Facts</h2>
                  <div className="prose dark:prose-dark">
                    <ul className="grid md:grid-cols-2 grid-cols-1 md:gap-x-5">
                      {quickFacts?.map((quickFact: string) => (
                        <li
                          key={quickFact}
                          className="text-gray-900 dark:text-gray-100 leading-6"
                        >
                          {quickFact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {essentialQuestions && (
                <div className="mt-8 border border-gray-100 dark:border-gray-700 rounded-md p-5">
                  <h2 className="text-lg font-semibold mb-3">
                    Essential Questions
                  </h2>
                  <div className="prose dark:prose-dark">
                    <ul className="grid md:grid-cols-2 grid-cols-1 md:gap-x-5">
                      {essentialQuestions?.map((essentialQuestion: string) => (
                        <li
                          key={essentialQuestion}
                          className="text-gray-900 dark:text-gray-100 leading-6"
                        >
                          {essentialQuestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <LearnerRatings collection={course} />
              {!isEmpty(pairWithResources) && (
                <div className="my-12 md:flex hidden flex-col space-y-2">
                  <h2 className="text-lg font-semibold mb-3">
                    You might also like these resources:
                  </h2>
                  {pairWithResources.map((resource: any) => {
                    return (
                      <div key={resource.slug}>
                        <CardHorizontal
                          className="border my-4 border-opacity-10 border-gray-400 dark:border-gray-700"
                          resource={resource}
                          location={course.path}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </header>
          </div>
          <div className="md:col-span-2 flex flex-col items-center justify-start md:mb-0 mb-4">
            {image_url && (
              <div className="md:block hidden">
                <Image
                  src={image_url}
                  alt={`illustration for ${title}`}
                  height={imageIsTag ? 200 : 420}
                  width={imageIsTag ? 200 : 420}
                  className="md:block hidden"
                  quality={100}
                />
              </div>
            )}
            <div className="md:block hidden space-y-6">
              <div className="w-full flex justify-center mt-10 mb-4">
                <PlayButton lesson={nextLesson} />
              </div>

              <Fresh freshness={freshness} />

              <CourseProjectCard courseProject={courseProject} />

              <div className="">
                {get(course, 'free_forever') && (
                  <div className="p-3 border border-gray-100 rounded-md bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                    <CommunityResource type="course" />
                  </div>
                )}
              </div>

              {illustrator && (
                <div className="w-full">
                  <h4 className="font-semibold">Credits</h4>
                  <span className="text-sm">
                    {illustrator?.name} (illustration)
                  </span>
                </div>
              )}
            </div>
            <section className="mt-8">
              <div className="mb-2 flex flex-col space-y-4">
                <h2 className="text-xl font-bold">Course Content </h2>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-normal">
                  {duration && `${convertTimeWithTitles(duration)} • `}
                  {lessons.length + playlistLessons.length} lessons
                </div>
              </div>
              <div>
                <ul>
                  {playlists.map((playlist: any) => {
                    return (
                      <li key={playlist.slug}>
                        <div className="font-semibold flex items-center leading-tight py-2">
                          {playlist.path && (
                            <Link href={playlist.path}>
                              <a
                                onClick={() => {
                                  track(
                                    `clicked collection link on course page`,
                                    {
                                      course: course.slug,
                                      collection: playlist.slug,
                                    },
                                  )
                                }}
                                className="hover:underline font-semibold flex items-center w-full"
                              >
                                <Markdown className="prose dark:prose-dark md:dark:prose-lg-dark md:prose-lg text-gray-900 dark:text-gray-100 mt-0">
                                  {playlist.title}
                                </Markdown>
                              </a>
                            </Link>
                          )}
                        </div>
                        <div>
                          <ul className="ml-8">
                            {playlist?.lessons?.map(
                              (lesson: LessonResource, index: number) => {
                                const isComplete = completedLessonSlugs.includes(
                                  lesson.slug,
                                )
                                return (
                                  <li key={`${playlist.slug}::${lesson.slug}`}>
                                    <div className="flex items-center leading-tight py-2">
                                      <div className="flex items-center mr-2 flex-grow">
                                        <small className="text-gray-500 dark:text-gray-600 pt-px font-xs transform scale-75 font-normal w-4">
                                          {isComplete ? `✔️` : index + 1}
                                        </small>
                                        <PlayIcon className="text-gray-500 dark:text-gray-100 mx-1" />
                                      </div>
                                      {lesson.path && (
                                        <Link href={lesson.path}>
                                          <a
                                            onClick={() => {
                                              track(
                                                `clicked collection video link on course page`,
                                                {
                                                  course: course.slug,
                                                  video: lesson.slug,
                                                  collection: playlist.slug,
                                                },
                                              )
                                            }}
                                            className="hover:underline flex items-center w-full"
                                          >
                                            <Markdown className="prose dark:prose-dark md:dark:prose-lg-dark md:prose-lg text-gray-700 dark:text-gray-100 mt-0">
                                              {lesson.title}
                                            </Markdown>
                                          </a>
                                        </Link>
                                      )}
                                    </div>
                                  </li>
                                )
                              },
                            )}
                          </ul>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div>
                <ul>
                  {lessons.map((lesson: LessonResource, index: number) => {
                    const isComplete = completedLessonSlugs.includes(
                      lesson.slug,
                    )
                    return (
                      <li key={lesson.slug}>
                        <div className="font-semibold flex  leading-tight py-2">
                          <div className="flex items-center mr-2 space-x-2">
                            <div
                              className={`${
                                isComplete
                                  ? 'text-blue-600 dark:text-green-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              } pt-px font-xs transform scale-75 font-normal w-4`}
                            >
                              {isComplete ? (
                                <CheckIcon className="w-6 h-6 transform -translate-x-2" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            {lesson.icon_url && (
                              <div className="flex flex-shrink-0 w-8 items-center">
                                <Image
                                  src={lesson.icon_url}
                                  width={24}
                                  height={24}
                                />
                              </div>
                            )}
                          </div>
                          {lesson.path && (
                            <div className="flex flex-col ">
                              <div>
                                <Link href={lesson.path}>
                                  <a
                                    onClick={() => {
                                      track(
                                        `clicked video link on course page`,
                                        {
                                          course: course.slug,
                                          video: lesson.slug,
                                        },
                                      )
                                    }}
                                    className="text-lg hover:underline hover:text-blue-600 font-semibold dark:text-gray-100"
                                  >
                                    {lesson.title}
                                  </a>
                                </Link>
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-500">
                                {convertTimeWithTitles(lesson.duration, {
                                  showSeconds: true,
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
            {!isEmpty(pairWithResources) && (
              <div className="my-12 flex md:hidden flex-col space-y-2">
                <h2 className="text-lg font-semibold mb-3">
                  You might also like these resources:
                </h2>
                {pairWithResources.map((resource: any) => {
                  return (
                    <div key={resource.slug}>
                      <CardHorizontal
                        className="border my-4 border-opacity-10 border-gray-400 dark:border-gray-500"
                        resource={resource}
                        location={course.path}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const Fresh = ({freshness}: {freshness: any}) => {
  if (!freshness) return null

  const reviewedAt = friendlyTime(
    parse(freshness.asOf, 'yyyy-MM-dd', new Date()),
  )
  return (
    <>
      {freshness && (
        <div
          className={`flex flex-col space-y-1 ${
            freshness.status === 'fresh'
              ? 'border-green-500 border bg-green-50 dark:bg-teal-900'
              : freshness.status === 'classic'
              ? 'border-blue-500 border bg-blue-50 dark:bg-blueGray-800'
              : freshness.status === 'stale'
              ? 'border-orange-500 border bg-orange-50 dark:bg-orange-900'
              : 'border'
          } border-opacity-20 p-4 my-3 rounded-md`}
        >
          {freshness.title && (
            <h2 className="text-xl font-semibold">
              {freshness.status === 'fresh' && '🌱'}
              {freshness.status === 'stale' && '⛔️'}
              {freshness.status === 'classic' && '💎'} {freshness.title}
            </h2>
          )}
          {freshness.asOf && (
            <p>
              <small>Staff reviewed: {reviewedAt}</small>
            </p>
          )}
          {freshness.text && (
            <Markdown className="prose dark:prose-dark w-full">
              {freshness.text}
            </Markdown>
          )}
        </div>
      )}
    </>
  )
}

const CourseProjectCard = ({courseProject}: {courseProject: any}) => {
  return (
    <>
      {courseProject && (
        <div className="border-indigo-500 hover:border-indigo-700 dark:hover:border-indigo-400 rounded-md bg-indigo-100 dark:bg-indigo-900 border-opacity-20 p-4 my-8 border">
          {courseProject && (
            <Link href={courseProject.url}>
              <a>
                {courseProject.label && (
                  <h2 className="text-xl font-semibold mb-4">
                    ⚔️ {courseProject.label}
                  </h2>
                )}
                {courseProject.text && (
                  <Markdown className="prose dark:prose-dark w-full">
                    {courseProject.text}
                  </Markdown>
                )}
              </a>
            </Link>
          )}
        </div>
      )}
    </>
  )
}

const CoursePodcast = ({
  podcast: {transcript, simplecast_uid: id},
  instructorName,
}: any) => {
  const [isOpen, setOpen] = React.useState(false)
  const {theme} = useTheme()

  if (isEmpty(id)) {
    return null
  } else {
    return (
      <div className="w-full pt-2 pb-3">
        <h3 className="font-semibold text-xl my-2">
          {`Listen to ${instructorName} tell you about this course:`}{' '}
          {transcript && (
            <span>
              <button onClick={() => setOpen(!isOpen)}>
                {isOpen ? 'Hide Transcript' : 'Show Transcript'}
              </button>
            </span>
          )}
        </h3>
        <iframe
          height="52px"
          width="100%"
          frameBorder="no"
          scrolling="no"
          seamless
          src={`https://player.simplecast.com/${id}?dark=${
            theme === 'dark'
          }&color=${theme === 'dark' && '111827'}`}
        />
        {isOpen && transcript && (
          <Markdown className="bb b--black-10 pb3 lh-copy">
            {transcript}
          </Markdown>
        )}
      </div>
    )
  }
}

export default CollectionPageLayout
