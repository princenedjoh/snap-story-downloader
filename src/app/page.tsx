'use client'

// pages/index.js
import Head from 'next/head';
import { useState } from 'react';
import { Download, ArrowRight, Check, X, Loader2 } from 'lucide-react';

export default function Home() {
	const [url, setUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [downloadUrl, setDownloadUrl] = useState('');
	const [mediaList, setMediaList] = useState<any[]>([]);
	const [totalMedia, setTotalMedia] = useState(0);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!url) {
			setError('Please enter a Snapchat story URL');
			return;
		}

		// Reset states
		setError('');
		setSuccess(false);
		setLoading(true);
		setMediaList([]);

		try {
			const response = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to download story');
			}

			if (response.headers.get('content-type')?.includes('application/json')) {
				const data = await response.json();
				setMediaList(data.mediaList);
				setTotalMedia(data.total);
				setSuccess(true);
			} else {
				const blob = await response.blob();
				const downloadUrl = window.URL.createObjectURL(blob);
				setDownloadUrl(downloadUrl);
				setSuccess(true);
			}
		} catch (err: any) {
			setError(err.message || 'Failed to download story. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const downloadMedia = async (media: any) => {
		try {
			const response = await fetch(media.url);
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			
			const extension = media.isVideo ? 'mp4' : 'jpg';
			const a = document.createElement('a');
			a.href = downloadUrl;
			a.download = `snap-story-${Date.now()}.${extension}`;
			a.click();
			window.URL.revokeObjectURL(downloadUrl);
		} catch (err: any) {
			setError(err.message || 'Failed to download media. Please try again.');
		}
	};

	const resetForm = () => {
		setUrl('');
		setError('');
		setSuccess(false);
		setDownloadUrl('');
		setMediaList([]);
		setTotalMedia(0);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 text-gray-800">
			<Head>
				<title>Snapchat Story Downloader</title>
				<meta name="description" content="Download Snapchat stories easily" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="container mx-auto px-4 py-16">
				<div className="max-w-3xl mx-auto">
					<div className="text-center mb-12">
						<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
							Snapchat Story Downloader
						</h1>
						<p className="text-lg text-gray-600">
							Download any Snapchat story by simply pasting the URL below
						</p>
					</div>

					<div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
						{!success ? (
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="space-y-2">
									<label htmlFor="snapUrl" className="block text-sm font-medium text-gray-700">
										Snapchat Story URL
									</label>
									<div className="relative">
										<input
											id="snapUrl"
											type="url"
											value={url}
											onChange={(e) => setUrl(e.target.value)}
											placeholder="https://story.snapchat.com/..."
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
										/>
										{url && (
											<button
												type="button"
												onClick={() => setUrl('')}
												className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
											>
												<X size={16} />
											</button>
										)}
									</div>
								</div>

								<button
									type="submit"
									disabled={loading}
									className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-70"
								>
									{loading ? (
										<>
											<Loader2 size={20} className="mr-2 animate-spin" />
											Processing...
										</>
									) : (
										<>
											Download Story
											<ArrowRight size={20} className="ml-2" />
										</>
									)}
								</button>

								{error && (
									<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
										<X size={16} className="mr-2 flex-shrink-0" />
										{error}
									</div>
								)}
							</form>
						) : (
							<div className="space-y-6">
								<div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
									<div className="bg-green-100 rounded-full p-2 mr-3">
										<Check size={20} className="text-green-600" />
									</div>
									<p className="text-green-700 font-medium">Story ready for download!</p>
								</div>

								{mediaList.length > 0 ? (
									<div className="space-y-4">
										<p className="text-sm text-gray-600">Found {totalMedia} media files:</p>
										<div className="space-y-2">
											{mediaList.map((media, index) => (
												<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
													<div className="flex items-center">
														<span className="text-sm font-medium text-gray-700">{media.index}. </span>
														<span className="text-sm text-gray-600">{media.isVideo ? 'Video' : 'Image'}</span>
													</div>
													<button
														onClick={() => downloadMedia(media)}
														className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
													>
														Download
													</button>
												</div>
											))}
										</div>
									</div>
								) : (
									<div className="flex flex-col sm:flex-row gap-3">
										<a
											href={downloadUrl}
											download={`snap-story-${Date.now()}.${downloadUrl.includes('video') ? 'mp4' : 'jpg'}`}
											className="flex-1 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition text-center"
										>
											<Download size={20} className="mr-2" />
											Download Now
										</a>
										<button
											onClick={resetForm}
											className="flex-1 border border-gray-300 py-3 px-6 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition text-center"
										>
											Download Another
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="bg-white rounded-2xl shadow-lg p-6">
						<h2 className="font-bold text-xl mb-4">How it works</h2>
						<div className="space-y-4">
							<div className="flex items-start">
								<div className="bg-blue-100 rounded-full w-[30px] h-[30px] flex items-center justify-center mr-4 mt-1">
									<span className="font-medium text-blue-600">1</span>
								</div>
								<div>
									<h3 className="font-medium">Copy the Snapchat Story URL</h3>
									<p className="text-gray-600 text-sm">Open Snapchat, navigate to the story you want to download, and copy the share link</p>
								</div>
							</div>

							<div className="flex items-start">
								<div className="bg-blue-100 rounded-full w-[30px] h-[30px] flex items-center justify-center mr-4 mt-1">
									<span className="font-medium text-blue-600">2</span>
								</div>
								<div>
									<h3 className="font-medium">Paste the URL above</h3>
									<p className="text-gray-600 text-sm">Paste the copied link into the input field and click "Download Story"</p>
								</div>
							</div>

							<div className="flex items-start">
								<div className="bg-blue-100 rounded-full w-[30px] h-[30px] flex items-center justify-center mr-4 mt-1">
									<span className="font-medium text-blue-600">3</span>
								</div>
								<div>
									<h3 className="font-medium">Download your content</h3>
									<p className="text-gray-600 text-sm">Once processed, click the download button to save the story to your device</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			<footer className="mt-16 pb-8 text-center text-gray-500 text-sm">
				<p>© {new Date().getFullYear()} Snapchat Story Downloader. For personal use only.</p>
				<p className="mt-1">This tool is not affiliated with Snapchat.</p>
			</footer>
		</div>
	);
}