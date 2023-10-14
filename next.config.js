/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production"

const withPWA = require('next-pwa')({
    dest: 'public',
    skipWaiting: true,
    register: isProduction,
    disable: !isProduction,
});


const nextConfig = withPWA({
    output: "export",
    trailingSlash: true,
    cleanDistDir: true,
    images: {
        unoptimized: true
    }
})

module.exports = nextConfig
