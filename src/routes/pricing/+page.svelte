<script lang="ts">
	import { base } from "$app/paths";
	import { goto } from "$app/navigation";
	import { getContext } from "svelte";
	import PublicHeader from "$lib/components/PublicHeader.svelte";

	const publicConfig = getContext("publicConfig");

	const pricingPlans = [
		{
			name: "Free",
			price: "$0",
			period: "forever",
			description: "Perfect for getting started with AI tutoring",
			features: [
				"5 AI conversations per day",
				"Basic subjects (Math, Science, English)",
				"Community support",
				"Study progress tracking",
				"Mobile and web access"
			],
			limitations: [
				"Limited daily usage",
				"Basic AI responses only",
				"No priority support"
			],
			popular: false,
			buttonText: "Get Started Free",
			buttonStyle: "secondary"
		},
		{
			name: "Student",
			price: "$9.99",
			period: "per month",
			description: "Everything you need for academic success",
			features: [
				"Unlimited AI conversations",
				"All subjects and topics",
				"Advanced AI explanations",
				"Priority support (24/7)",
				"Detailed study analytics",
				"Custom study schedules",
				"Homework help",
				"Essay writing assistance",
				"Math problem solver",
				"Science lab support"
			],
			limitations: [],
			popular: true,
			buttonText: "Start Free Trial",
			buttonStyle: "primary"
		},
		{
			name: "Premium",
			price: "$19.99",
			period: "per month",
			description: "Advanced tutoring with personalized learning",
			features: [
				"Everything in Student plan",
				"1-on-1 AI tutoring sessions",
				"Custom study plans",
				"Exam preparation courses",
				"Advanced problem solving",
				"Research paper assistance",
				"College prep support",
				"AP/SAT/ACT test prep",
				"Multiple AI model access",
				"Export study materials",
				"Offline study guides"
			],
			limitations: [],
			popular: false,
			buttonText: "Start Premium Trial",
			buttonStyle: "secondary"
		}
	];

	const features = [
		{
			category: "Core Features",
			items: [
				{ name: "AI Conversations", free: "5/day", student: "Unlimited", premium: "Unlimited" },
				{ name: "Subject Coverage", free: "Basic", student: "All", premium: "All + Advanced" },
				{ name: "Response Quality", free: "Standard", student: "Enhanced", premium: "Premium" },
				{ name: "Support", free: "Community", student: "Priority", premium: "Dedicated" }
			]
		},
		{
			category: "Study Tools",
			items: [
				{ name: "Progress Tracking", free: true, student: true, premium: true },
				{ name: "Study Analytics", free: false, student: true, premium: true },
				{ name: "Custom Schedules", free: false, student: true, premium: true },
				{ name: "Exam Prep", free: false, student: false, premium: true },
				{ name: "Research Tools", free: false, student: false, premium: true }
			]
		},
		{
			category: "Advanced Features",
			items: [
				{ name: "Multiple AI Models", free: false, student: false, premium: true },
				{ name: "Export Materials", free: false, student: false, premium: true },
				{ name: "Offline Access", free: false, student: false, premium: true },
				{ name: "1-on-1 Sessions", free: false, student: false, premium: true }
			]
		}
	];

	function handlePlanSelect(plan: typeof pricingPlans[0]) {
		goto(`${base}/`);
	}
</script>

<svelte:head>
	<title>Pricing - {publicConfig.PUBLIC_APP_NAME}</title>
	<meta name="description" content="Choose the perfect AI tutoring plan for your learning needs. Start free and upgrade as you grow." />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<PublicHeader />
	<!-- Header -->
	<div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="text-center">
				<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
					Choose Your Learning Plan
				</h1>
				<p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
					Start with our free plan and upgrade as your learning needs grow. 
					All plans include access to our AI tutoring platform.
				</p>
			</div>
		</div>
	</div>

	<!-- Pricing Cards -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
			{#each pricingPlans as plan}
				<div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg {plan.popular ? 'ring-2 ring-blue-500' : 'border border-gray-200 dark:border-gray-700'} p-8">
					{#if plan.popular}
						<div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
							<span class="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium">
								Most Popular
							</span>
						</div>
					{/if}

					<div class="text-center mb-8">
						<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
						<p class="text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
						<div class="flex items-center justify-center mb-2">
							<span class="text-5xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
							{#if plan.price !== "$0"}
								<span class="text-gray-500 dark:text-gray-400 ml-2">/{plan.period}</span>
							{/if}
						</div>
						{#if plan.price !== "$0"}
							<p class="text-sm text-gray-500 dark:text-gray-400">7-day free trial included</p>
						{/if}
					</div>

					<div class="mb-8">
						<h4 class="font-semibold text-gray-900 dark:text-white mb-4">What's included:</h4>
						<ul class="space-y-3">
							{#each plan.features as feature}
								<li class="flex items-start">
									<svg class="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
									</svg>
									<span class="text-gray-700 dark:text-gray-300">{feature}</span>
								</li>
							{/each}
						</ul>

						{#if plan.limitations.length > 0}
							<div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
								<h4 class="font-semibold text-gray-700 dark:text-gray-400 mb-3">Limitations:</h4>
								<ul class="space-y-2">
									{#each plan.limitations as limitation}
										<li class="flex items-start">
											<svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
											</svg>
											<span class="text-gray-500 dark:text-gray-400 text-sm">{limitation}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>

					<button 
						on:click={() => handlePlanSelect(plan)}
						class="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors duration-200 
						{plan.buttonStyle === 'primary' 
							? 'bg-blue-600 hover:bg-blue-700 text-white' 
							: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'}"
					>
						{plan.buttonText}
					</button>
				</div>
			{/each}
		</div>

		<!-- Feature Comparison Table -->
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
			<div class="px-8 py-6 bg-gray-50 dark:bg-gray-700">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white text-center">
					Feature Comparison
				</h2>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-200 dark:border-gray-600">
							<th class="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Feature</th>
							<th class="text-center py-4 px-6 font-semibold text-gray-900 dark:text-white">Free</th>
							<th class="text-center py-4 px-6 font-semibold text-blue-600 dark:text-blue-400">Student</th>
							<th class="text-center py-4 px-6 font-semibold text-gray-900 dark:text-white">Premium</th>
						</tr>
					</thead>
					<tbody>
						{#each features as category}
							<tr class="border-b border-gray-100 dark:border-gray-700">
								<td colspan="4" class="py-4 px-6 bg-gray-50 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300">
									{category.category}
								</td>
							</tr>
							{#each category.items as item}
								<tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
									<td class="py-4 px-6 text-gray-900 dark:text-white">{item.name}</td>
									<td class="py-4 px-6 text-center">
										{#if typeof item.free === 'boolean'}
											{#if item.free}
												<svg class="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
												</svg>
											{:else}
												<span class="text-gray-400">—</span>
											{/if}
										{:else}
											<span class="text-gray-600 dark:text-gray-300">{item.free}</span>
										{/if}
									</td>
									<td class="py-4 px-6 text-center">
										{#if typeof item.student === 'boolean'}
											{#if item.student}
												<svg class="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
												</svg>
											{:else}
												<span class="text-gray-400">—</span>
											{/if}
										{:else}
											<span class="text-blue-600 dark:text-blue-400 font-medium">{item.student}</span>
										{/if}
									</td>
									<td class="py-4 px-6 text-center">
										{#if typeof item.premium === 'boolean'}
											{#if item.premium}
												<svg class="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
												</svg>
											{:else}
												<span class="text-gray-400">—</span>
											{/if}
										{:else}
											<span class="text-gray-600 dark:text-gray-300">{item.premium}</span>
										{/if}
									</td>
								</tr>
							{/each}
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- FAQ Section -->
		<div class="mt-16">
			<h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
				Frequently Asked Questions
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
						Can I change my plan anytime?
					</h3>
					<p class="text-gray-600 dark:text-gray-300">
						Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
						and we'll prorate your billing accordingly.
					</p>
				</div>

				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
						Is there really a free trial?
					</h3>
					<p class="text-gray-600 dark:text-gray-300">
						Absolutely! All paid plans come with a 7-day free trial. No credit card required to start, 
						and you can cancel anytime during the trial period.
					</p>
				</div>

				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
						What subjects are covered?
					</h3>
					<p class="text-gray-600 dark:text-gray-300">
						We cover all major academic subjects including Mathematics, Science, English, History, 
						Foreign Languages, Computer Science, and more. Premium plans include advanced topics and test prep.
					</p>
				</div>

				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
						How does AI tutoring work?
					</h3>
					<p class="text-gray-600 dark:text-gray-300">
						Our AI tutor uses advanced language models to provide personalized explanations, 
						step-by-step problem solving, and adaptive learning based on your progress and learning style.
					</p>
				</div>
			</div>
		</div>

		<!-- CTA Section -->
		<div class="mt-16 text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12">
			<h2 class="text-3xl font-bold text-white mb-4">
				Ready to Start Learning?
			</h2>
			<p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
				Join thousands of students who are already achieving better grades with AI tutoring.
			</p>
			<button 
				on:click={() => goto(`${base}/`)}
				class="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-lg transition-colors duration-200 text-lg"
			>
				Start Your Free Trial
			</button>
		</div>
	</div>
</div>