/** @type {import('next').NextConfig} */
const nextConfig = {
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
