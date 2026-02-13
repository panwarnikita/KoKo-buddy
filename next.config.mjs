// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // Turbopack ko error dene se rokne ke liye khali object
//   turbopack: {}, 
  
//   // experimental ke andar se webpackBuildWorker hata dein agar wo error de raha hai
  
//   async headers() {
//     return [
//       {
//         source: "/(.*)",
//         headers: [
//           { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
//           { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
//         ],
//       },
//     ];
//   },
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         path: false,
//       };
//     }
//     return config;
//   },
// };

// export default nextConfig;





// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // Turbopack settings ko rehne dete hain jaisa aapka tha
//   turbopack: {}, 
  
//   async headers() {
//     return [
//       {
//         source: "/(.*)",
//         headers: [
//           { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
//           { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
//         ],
//       },
//     ];
//   },
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         path: false,
//         // Piper TTS ko in dono ki bhi zaroorat hoti hai build skip karne ke liye
//         child_process: false,
//         crypto: false, 
//       };
//     }
//     return config;
//   },
// };

// export default nextConfig;




/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack ko explicitly empty rakhein ya hata dein
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        child_process: false,
        crypto: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;

