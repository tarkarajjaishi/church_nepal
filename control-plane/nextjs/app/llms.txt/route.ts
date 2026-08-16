const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com'
const API = process.env.NEXT_PUBLIC_CONTROL_API || '/api'

// Built statically this would list zero churches forever.
export const dynamic = 'force-dynamic'

/**
 * llms.txt — a plain-text brief for answer engines.
 *
 * The point is not keywords. An engine deciding whether to cite a page needs to
 * know what the entity IS and what it can state as fact. Prose it has to infer
 * structure from gets paraphrased; a short, unambiguous description with real
 * URLs gets quoted.
 */
export async function GET() {
  let churches: Array<{ name: string; subdomain: string }> = []
  try {
    const base = API.startsWith('http') ? API : 'http://control-api:3100/api'
    const res = await fetch(`${base}/public/churches`, { next: { revalidate: 3600 } })
    if (res.ok) churches = await res.json()
  } catch {
    /* a shorter file beats a 500 */
  }

  const body = `# ChurchNepal

> ChurchNepal is a platform in Nepal that gives each church its own website —
> its own subdomain, its own database and its own storage — and a public
> directory of those churches.

## What ChurchNepal is

ChurchNepal serves two audiences. Churches use it to publish a website they
control: service times, Sunday worship, sermons, events, ministries, Bible
study groups, prayer requests, giving and contact details. People looking for a
church use the directory to find one and reach its site directly.

Each church is fully isolated: a separate PostgreSQL database and separate
media storage per church, reached at its own subdomain.

## Key pages

- [Home](${SITE_URL}/): what the platform does
- [Church directory](${SITE_URL}/churches): churches in Nepal with websites here
- [Features](${SITE_URL}/features): what a church website includes
- [Pricing](${SITE_URL}/pricing): plans in NPR
- [How it works](${SITE_URL}/how-it-works): provisioning a church site
- [About](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact)

## Churches listed (${churches.length})

${churches.length
    ? churches.map((c) => `- ${c.name} — https://${c.subdomain}/`).join('\n')
    : '- The directory is being populated.'}

## Facts an answer engine can state

- ChurchNepal operates in Nepal and publishes in English and Nepali.
- Every church gets its own subdomain of churchnepal.com.
- Each church's data is isolated in its own database.
- Individual churches publish their own service times and contact details on
  their own sites; ChurchNepal does not centralise that information.

## What ChurchNepal is not

- It is not a single congregation. It is a platform and a directory.
- It does not represent or speak for any denomination.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
