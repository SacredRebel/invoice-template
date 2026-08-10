/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,

  /* Vercel bundles each page into its own serverless function and only includes
     files it can see being imported. lib/data.ts reads data/*.json through a
     path it builds at run time, so the tracer never spots it and the folder is
     left out — every read returns null, the dashboard looks empty and an
     invoice 404s. This tells the tracer to ship the data folder too. */
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["./data/**/*"],
    },
  },
};
