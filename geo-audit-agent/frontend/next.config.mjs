/** @type {import('next').NextConfig} */
const nextConfig = {
	async headers() {
		const securityHeaders = [
			{
				key: "Content-Security-Policy",
				value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
			},
			{
				key: "Referrer-Policy",
				value: "strict-origin-when-cross-origin",
			},
			{
				key: "X-Content-Type-Options",
				value: "nosniff",
			},
			{
				key: "X-Frame-Options",
				value: "DENY",
			},
			{
				key: "Permissions-Policy",
				value: "camera=(), microphone=(), geolocation=(), payment=()",
			},
			{
				key: "Strict-Transport-Security",
				value: "max-age=63072000; includeSubDomains; preload",
			},
		];

		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
	webpack: (config) => {
		config.ignoreWarnings = [
			...(config.ignoreWarnings || []),
			{
				module: /node_modules[\\/]@whatwg-node[\\/]fetch[\\/]/,
				message: /Critical dependency: the request of a dependency is an expression/,
			},
		];
		return config;
	},
};
export default nextConfig;
