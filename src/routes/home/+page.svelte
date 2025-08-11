<script lang="ts">
    import { base } from "$app/paths";
    import { goto } from "$app/navigation";
    import { getContext, onDestroy, onMount } from "svelte";
    import PublicHeader from "$lib/components/PublicHeader.svelte";

    import CarbonChat from "~icons/carbon/chat";
    import CarbonBook from "~icons/carbon/book";
    import CarbonFlash from "~icons/carbon/flash";
    import CarbonIdea from "~icons/carbon/idea";
    import CarbonPlay from "~icons/carbon/play";
    import CarbonSearch from "~icons/carbon/search";
    import CarbonDocument from "~icons/carbon/document";
    import CarbonChartBar from "~icons/carbon/chart-bar";
    import CarbonChartLine from "~icons/carbon/chart-line";
    import CarbonMachineLearning from "~icons/carbon/machine-learning";

    const publicConfig = getContext("publicConfig");

    // Hero: cycling hints
    const cyclingHints = [
        "I need help with 11+ verbal reasoning? Try asking for practice questions!",
        "I'm struggling with fractions — can you teach me step-by-step?",
        "Want to revise vocabulary for SATs",
        "Can you help me with English comprehension?",
    ];
    let hintIndex = $state(0);
    let hintTimer: ReturnType<typeof setInterval> | undefined = $state();

    onMount(() => {
        hintTimer = setInterval(() => {
            hintIndex = (hintIndex + 1) % cyclingHints.length;
        }, 3000);
    });
    onDestroy(() => hintTimer && clearInterval(hintTimer));

    // Quick actions
    const quickActions = [
        { label: "Chat with Tutor", icon: CarbonChat, q: "Start a new study session" },
        { label: "Homework Help", icon: CarbonBook, q: "Help me with my homework" },
        { label: "Revise with Flash Cards", icon: CarbonFlash, q: "Create flash cards for key topics" },
        { label: "Interactive Learning", icon: CarbonIdea, q: "Teach me with examples and practice" },
    ];

    function actionHref(q: string) {
        const params = new URLSearchParams({ q });
        return `${base}/chat?${params.toString()}`;
    }

    // How it works timeline
    const timeline = [
        { step: 1, title: "Free AI Assessment", desc: "Quick 5-minute assessment that identifies strengths and improvement areas.", icon: CarbonSearch },
        { step: 2, title: "Personalized Study Plan", desc: "Custom study plan designed for specific needs and exam goals.", icon: CarbonDocument },
        { step: 3, title: "AI Tutoring Tools", desc: "Interactive learning with Chat Tutor, Homework Help and Flash Cards.", icon: CarbonChat },
        { step: 4, title: "Subject Practice", desc: "Master key topics with targeted quizzes in Maths, English and reasoning.", icon: CarbonBook },
        { step: 5, title: "Track Progress", desc: "Monitor improvement with detailed AI progress reports.", icon: CarbonChartBar },
    ];

    // Features
    const features = [
        {
            title: "AI-Powered Adaptive Learning",
            subtitle: "Personalized Intelligence",
            description: "Analyzes learning patterns in real time and adjusts difficulty for measurable improvement.",
            icon: CarbonMachineLearning,
            metrics: ["Accuracy +40%", "3× faster learning"],
        },
        {
            title: "Instant AI Feedback",
            subtitle: "Lightning Fast Results",
            description: "Step‑by‑step explanations with gap detection so learners understand the ‘why’.",
            icon: CarbonFlash,
            metrics: ["<0.5s response", "98% explanation quality"],
        },
        {
            title: "Advanced Progress Analytics",
            subtitle: "Data‑Driven Insights",
            description: "Subject and topic breakdowns with actionable insights to guide revision.",
            icon: CarbonChartBar,
            metrics: ["500+ data points", "99.9% accuracy"],
        },
        {
            title: "Interactive Learning Tools",
            subtitle: "Focused Practice",
            description: "Targeted quizzes, visual explanations and spaced‑repetition for retention.",
            icon: CarbonIdea,
            metrics: ["95% engagement", "85% retention"],
        },
    ];

    // Testimonials
    const testimonials = [
        {
            name: "Emma Thompson",
            meta: "11+ Grammar | Westminster Primary",
            quote: "The personalized feedback made all the difference!",
            stats: ["+40% in Maths", "11+ score 95%"],
        },
        {
            name: "James Wilson",
            meta: "12+ Independent | Brighton Academy",
            quote: "It's like having a personal tutor 24/7.",
            stats: ["+35% English", "50% scholarship"],
        },
        {
            name: "Aisha Patel",
            meta: "13+ Senior | London Grammar",
            quote: "Seeing my scores go up each week was amazing!",
            stats: ["+50% Science", "Top 5% in 13+"],
        },
        {
            name: "Oliver Chen",
            meta: "SATs | Manchester Primary",
            quote: "Gamified learning made study sessions enjoyable.",
            stats: ["+45% overall", "Level 6 in all subjects"],
        },
    ];

    // Pricing
    const pricingPlans = [
        {
            name: "7 Days Explorer (Free Trial)",
            price: "£0",
            period: "for 7 days",
            features: [
                "Experience all core features",
                "Explore MCQs across subjects",
                "Unlimited timed practice sets",
                "Immediate feedback after each question",
            ],
            popular: false,
        },
        {
            name: "Plus",
            price: "£5.99",
            period: "per month",
            badge: "Save 15% yearly",
            features: [
                "Practice across all subjects & exams",
                "Tailored learning materials",
                "Detailed stats per subject & chapter",
                "Real-time answers and explanations",
            ],
            popular: false,
        },
        {
            name: "Pro (Most Popular)",
            price: "£6.99",
            period: "per month",
            badge: "Best Value",
            features: [
                "Everything in Plus",
                "Chat feature with tutors",
                "Premium exam-preparation sets",
                "Up to 50x more messages with AI Tutor",
                "Automatic updates",
            ],
            popular: true,
        },
    ];

    function handleGetStarted() {
        goto(`${base}/chat`);
    }

    function handleStartTrial() {
        goto(`${base}/chat`);
    }
</script>

<svelte:head>
    <title>AI Tutoring Platform - Previsely</title>
	<meta name="description" content="Transform your learning with AI-powered tutoring. Get personalized help, instant feedback, and 24/7 support across all subjects." />
</svelte:head>

<div class="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
	<PublicHeader />
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-20 lg:py-32">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                    <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        Supplement Your Final Preparation with
                        <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> AI-Powered Revision</span>
                    </h1>
                    <p class="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
                        Take a quick AI assessment to uncover strengths and areas to improve, tailored to your exam goals. In just minutes, know where you excel — whether it's Maths, English, or reasoning — and highlight areas needing a boost.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button on:click={handleGetStarted} class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200">
                            Start Learning
                        </button>
                        <button on:click={handleStartTrial} class="px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 font-semibold rounded-lg transition-colors duration-200">
                            Try Demo
                        </button>
                    </div>

                    <!-- Quick Actions -->
                    <div class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {#each quickActions as qa}
                            <a href={actionHref(qa.q)} class="flex items-center gap-2 rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/70 backdrop-blur px-3 py-2 hover:shadow-md transition-all">
                                <qa.icon class="w-5 h-5 text-blue-600" />
                                <span class="text-sm text-gray-800 dark:text-gray-200">{qa.label}</span>
                            </a>
                        {/each}
                    </div>
                </div>

                <!-- Mini Chat Input with cycling hint -->
                <div class="relative rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-sm">
                    <div class="mb-4 text-sm text-gray-500 dark:text-gray-400">Try asking:</div>
                    <div class="rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 text-gray-700 dark:text-gray-200">
                        {cyclingHints[hintIndex]}
                    </div>
                    <div class="mt-6 flex items-center gap-3">
                        <a href={actionHref(cyclingHints[hintIndex])} class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                            <CarbonChat class="w-5 h-5" /> Ask Tutor
                        </a>
                        <a href={actionHref("Give me a quick assessment") } class="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <CarbonPlay class="w-5 h-5 text-blue-600" /> Free AI Assessment
                        </a>
                    </div>
                </div>
            </div>
		</div>
		
		<!-- Decorative Elements -->
		<div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div class="absolute -top-40 -right-32 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply opacity-20 animate-pulse"></div>
            <div class="absolute -bottom-32 -left-40 w-80 h-80 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply opacity-20 animate-pulse delay-1000"></div>
            <!-- Floating exam badges -->
            <div class="absolute left-10 top-10 animate-[float_6s_ease-in-out_infinite] text-2xl">11+</div>
            <div class="absolute right-16 bottom-16 animate-[float_7s_ease-in-out_infinite] text-2xl">SATs</div>
            <div class="absolute left-1/3 bottom-8 animate-[float_5s_ease-in-out_infinite] text-2xl">📐</div>
            <div class="absolute right-1/3 top-1/4 animate-[float_8s_ease-in-out_infinite] text-2xl">📊</div>
		</div>
	</section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">How We Guide Your Child to Exam Success!</h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Our AI-powered platform transforms exam prep into a personalized, step-by-step journey for SATs, 11+, 12+ and 13+. Discover how we support progress now!</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
                {#each timeline as t}
                    <div class="text-center">
                        <div class="w-16 h-16 bg-blue-600 shadow-lg shadow-blue-600/30 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">{t.step}</div>
                        <svelte:component this={t.icon} class="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.title}</h3>
                        <p class="text-gray-600 dark:text-gray-300 text-sm">{t.desc}</p>
                    </div>
                {/each}
            </div>

            <div class="mt-10 text-center">
                <a href="{base}/chat?q=Start%20your%20free%20assessment" class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
                    <CarbonPlay class="w-5 h-5" /> Start Your Free Assessment Now – Boost Prep Today!
                </a>
            </div>
        </div>
    </section>

    <!-- Video Features Section -->
    <section id="video" class="py-20 bg-white dark:bg-gray-800 scroll-mt-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-10">
                <span class="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 px-3 py-1 text-sm mb-3">See it in action <CarbonPlay class="w-4 h-4" /></span>
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Experience AI-Powered Learning <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">in Real-Time</span></h2>
                <p class="mt-3 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Watch how our AI tutor adapts to your learning style, provides instant feedback, and creates personalized study paths that make exam preparation engaging and effective.</p>
            </div>

            <div class="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 aspect-video flex items-center justify-center">
                <div class="text-center">
                    <button class="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-gray-800/80 px-5 py-3 shadow hover:shadow-md">
                        <CarbonPlay class="w-6 h-6 text-blue-600" /> Watch Demo (coming soon)
                    </button>
                    <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Demo video placeholder</p>
                </div>
            </div>

            <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="rounded-lg border border-gray-200/60 dark:border-gray-700/60 p-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                    <CarbonFlash class="w-5 h-5 text-blue-600" />
                    <span>Instant AI feedback on every answer</span>
                </div>
                <div class="rounded-lg border border-gray-200/60 dark:border-gray-700/60 p-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                    <CarbonChartLine class="w-5 h-5 text-blue-600" />
                    <span>Adaptive difficulty based on performance</span>
                </div>
                <div class="rounded-lg border border-gray-200/60 dark:border-gray-700/60 p-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                    <CarbonChartBar class="w-5 h-5 text-blue-600" />
                    <span>Progress tracking with detailed analytics</span>
                </div>
            </div>

            <div class="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span class="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 px-3 py-1">
                    <CarbonIdea class="w-4 h-4 text-blue-600" /> Personalized Learning
                </span>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 px-3 py-1">
                    <CarbonFlash class="w-4 h-4 text-blue-600" /> Instant Feedback
                </span>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 px-3 py-1">
                    <CarbonChartBar class="w-4 h-4 text-blue-600" /> Progress Tracking
                </span>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <span class="inline-flex items-center gap-2 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 px-3 py-1 text-sm mb-3">Powered by Advanced AI ✨</span>
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Revolutionary Learning Technology <span class="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">That Actually Works</span></h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Experience the future of education with our cutting-edge AI platform designed to accelerate academic success through personalized, adaptive learning.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {#each features as f}
                    <div class="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60 hover:shadow-md transition-all">
                        <div class="mb-4 inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 size-10">
                            <svelte:component this={f.icon} class="w-5 h-5" />
                        </div>
                        <div class="text-sm text-blue-600 dark:text-blue-300 font-semibold">{f.subtitle}</div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.description}</p>
                        {#if f.metrics?.length}
                            <div class="mt-3 flex flex-wrap gap-2">
                                {#each f.metrics as m}
                                    <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60">{m}</span>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section id="success" class="py-20 bg-white dark:bg-gray-800 scroll-mt-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-10">
                <span class="inline-flex items-center gap-2 rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200 px-3 py-1 text-sm mb-3">Student Success Stories ✨</span>
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Students Are Achieving <span class="bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">Incredible Results</span></h2>
                <p class="mt-3 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">See how our AI-powered platform has transformed academic journeys, helping students achieve their goals and unlock their full potential.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {#each testimonials as t}
                    <div class="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-6 hover:shadow-md transition-all">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                                {t.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-white">{t.name}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">{t.meta}</div>
                            </div>
                        </div>
                        <blockquote class="italic text-gray-800 dark:text-gray-200">“{t.quote}”</blockquote>
                        <div class="mt-4 flex flex-wrap gap-2">
                            {#each t.stats as s}
                                <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-900 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60">{s}</span>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-20 bg-white dark:bg-gray-800 scroll-mt-24">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Learning Journey</h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Start with our free trial and upgrade for advanced support when you're ready.</p>
			</div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
				{#each pricingPlans as plan}
                    <div class="relative bg-gray-50/70 dark:bg-gray-700/70 backdrop-blur rounded-xl p-8 border border-gray-200/60 dark:border-gray-700/60 {plan.popular ? 'ring-2 ring-blue-600 shadow-lg shadow-blue-600/20' : 'hover:shadow-lg transition-shadow'}">
						{#if plan.popular}
							<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<span class="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                    {plan.badge || 'Most Popular'}
								</span>
							</div>
						{/if}

						<div class="text-center mb-6">
							<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
							<div class="flex items-center justify-center mb-2">
								<span class="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
								<span class="text-gray-600 dark:text-gray-300 ml-2">/{plan.period}</span>
							</div>
						</div>

						<ul class="space-y-3 mb-8">
							{#each plan.features as feature}
								<li class="flex items-center">
									<svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
									</svg>
									<span class="text-gray-700 dark:text-gray-300">{feature}</span>
								</li>
							{/each}
						</ul>

                        <button 
							on:click={handleGetStarted}
							class="w-full py-3 px-4 {plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white'} font-semibold rounded-lg transition-colors duration-200"
						>
                            {plan.name.includes('Free') ? 'Start Free Trial' : 'Choose Plan'}
						</button>
					</div>
				{/each}
			</div>
		</div>
	</section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
				Ready to Transform Your Learning?
			</h2>
			<p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
				Join thousands of students already using AI tutoring to achieve their academic goals.
			</p>
			<button 
				on:click={handleGetStarted}
				class="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-lg transition-colors duration-200 text-lg"
			>
				Start Learning Today
			</button>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-gray-900 text-gray-300 py-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
				<div class="col-span-1 md:col-span-2">
					<h3 class="text-2xl font-bold text-white mb-4">{publicConfig.PUBLIC_APP_NAME}</h3>
					<p class="text-gray-400 mb-4">
						Empowering students worldwide with AI-powered tutoring and personalized learning experiences.
					</p>
				</div>

				<div>
					<h4 class="text-lg font-semibold text-white mb-4">Product</h4>
					<ul class="space-y-2">
                        <li><a href="{base}/chat" class="hover:text-white transition-colors">AI Tutor</a></li>
						<li><a href="{base}/home#pricing" class="hover:text-white transition-colors">Pricing</a></li>
						<li><a href="{base}/home#features" class="hover:text-white transition-colors">Features</a></li>
					</ul>
				</div>

				<div>
					<h4 class="text-lg font-semibold text-white mb-4">Support</h4>
					<ul class="space-y-2">
						<li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Contact Us</a></li>
						<li><a href="{base}/privacy" class="hover:text-white transition-colors">Privacy</a></li>
					</ul>
				</div>
			</div>

			<div class="border-t border-gray-800 mt-8 pt-8 text-center">
				<p class="text-gray-400">
					© 2024 {publicConfig.PUBLIC_APP_NAME}. All rights reserved.
				</p>
			</div>
		</div>
	</footer>
</div>