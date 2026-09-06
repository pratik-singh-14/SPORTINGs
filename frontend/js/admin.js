/*
=========================================================
 SPORTING - ADMIN DASHBOARD JAVASCRIPT
 File: frontend/js/admin.js

 FIXED VERSION
 - JWT authentication
 - Dashboard statistics
 - Applications
 - Participants
 - Events
 - Contacts
 - Search
 - Filters
 - View details
 - Delete records
 - Logout
 - Loading state FIXED
 - Dashboard selector compatibility FIXED
 - API response compatibility FIXED
=========================================================
*/

(function () {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_BASE_URL =
        window.SPORTING_API_BASE_URL ||
        "http://localhost:5000";

    const API = {
        auth: `${API_BASE_URL}/api/auth`,
        applications: `${API_BASE_URL}/api/applications`,
        participants: `${API_BASE_URL}/api/participants`,
        events: `${API_BASE_URL}/api/events`,
        contacts: `${API_BASE_URL}/api/contacts`
    };

    const STORAGE_KEYS = {
        token: "SPORTING_ADMIN_TOKEN",
        admin: "SPORTING_ADMIN",
        loginTime: "SPORTING_ADMIN_LOGIN_TIME"
    };

    let currentSection = "overview";

    let applications = [];
    let participants = [];
    let events = [];
    let contacts = [];

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    document.addEventListener("DOMContentLoaded", function () {
        initializeAdmin();
    });

    function initializeAdmin() {

        setupLogout();
        setupNavigation();
        setupFilters();
        setupSearch();
        setupModal();

        const isLoginPage =
            document.body.classList.contains("admin-login-page") ||
            window.location.pathname.toLowerCase().includes("admin-login");

        if (isLoginPage) {
            setupLoginForm();
            return;
        }

        if (!getToken()) {
            redirectToLogin();
            return;
        }

        loadAdminInformation();
        loadDashboard();
    }

    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    function getToken() {
        try {
            return localStorage.getItem(STORAGE_KEYS.token);
        } catch (error) {
            console.error("Token error:", error);
            return null;
        }
    }

    function saveToken(token) {
        localStorage.setItem(
            STORAGE_KEYS.token,
            token
        );
    }

    function removeToken() {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.admin);
        localStorage.removeItem(STORAGE_KEYS.loginTime);
    }

    function getAdmin() {
        try {
            const value =
                localStorage.getItem(STORAGE_KEYS.admin);

            return value ? JSON.parse(value) : null;

        } catch (error) {
            return null;
        }
    }

    function saveAdmin(admin) {
        try {
            localStorage.setItem(
                STORAGE_KEYS.admin,
                JSON.stringify(admin)
            );
        } catch (error) {
            console.error("Unable to save admin:", error);
        }
    }

    /* =====================================================
       LOGIN
    ===================================================== */

    function setupLoginForm() {

        const form =
            document.querySelector("#adminLoginForm") ||
            document.querySelector("#loginForm") ||
            document.querySelector('form[data-form="admin-login"]');

        if (!form) {
            return;
        }

        if (getToken()) {
            redirectToDashboard();
            return;
        }

        form.addEventListener("submit", handleLogin);

        setupPasswordToggle(form);
    }

    async function handleLogin(event) {

        event.preventDefault();

        const form = event.currentTarget;

        clearAdminMessage(form);

        const emailField =
            form.querySelector('[name="email"], #email');

        const passwordField =
            form.querySelector('[name="password"], #password');

        const email =
            emailField
                ? emailField.value.trim()
                : "";

        const password =
            passwordField
                ? passwordField.value
                : "";

        if (!email) {
            showAdminMessage(
                form,
                "Please enter your admin email.",
                "error"
            );
            emailField?.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showAdminMessage(
                form,
                "Please enter a valid email address.",
                "error"
            );
            emailField?.focus();
            return;
        }

        if (!password) {
            showAdminMessage(
                form,
                "Please enter your password.",
                "error"
            );
            passwordField?.focus();
            return;
        }

        const button =
            form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

        const originalText =
            getButtonText(button);

        setButtonLoading(
            button,
            true,
            "Signing in..."
        );

        try {

            const response =
                await fetch(
                    `${API.auth}/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Invalid email or password."
                );
            }

            const token =
                result.token ||
                result.accessToken ||
                result.data?.token;

            if (!token) {
                throw new Error(
                    "Login succeeded but no token was returned."
                );
            }

            saveToken(token);

            saveAdmin(
                result.admin ||
                result.user ||
                result.data?.admin ||
                {
                    email
                }
            );

            localStorage.setItem(
                STORAGE_KEYS.loginTime,
                new Date().toISOString()
            );

            showAdminMessage(
                form,
                "Login successful. Redirecting...",
                "success"
            );

            setTimeout(
                redirectToDashboard,
                500
            );

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            showAdminMessage(
                form,
                getErrorMessage(error),
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false,
                originalText || "Login"
            );
        }
    }

    /* =====================================================
       PASSWORD TOGGLE
    ===================================================== */

    function setupPasswordToggle(form) {

        const password =
            form.querySelector(
                '[name="password"], #password'
            );

        const toggle =
            form.querySelector("#togglePassword") ||
            form.querySelector("[data-toggle-password]");

        if (!password || !toggle) {
            return;
        }

        toggle.addEventListener("click", function () {

            const isPassword =
                password.type === "password";

            password.type =
                isPassword
                    ? "text"
                    : "password";

            toggle.textContent =
                isPassword
                    ? "Hide"
                    : "Show";
        });
    }

    /* =====================================================
       REDIRECTS
    ===================================================== */

    function redirectToLogin() {

        window.location.href =
            "admin-login.html";
    }

    function redirectToDashboard() {

        window.location.href =
            "admin-dashboard.html";
    }

    /* =====================================================
       ADMIN INFORMATION
    ===================================================== */

    function loadAdminInformation() {

        const admin =
            getAdmin();

        const name =
            admin?.name ||
            admin?.fullName ||
            admin?.username ||
            "SPORTING Admin";

        const email =
            admin?.email ||
            "Administrator";

        document
            .querySelectorAll(
                "#adminName, [data-admin-name]"
            )
            .forEach(function (element) {
                element.textContent = name;
            });

        document
            .querySelectorAll(
                "#adminEmail, [data-admin-email]"
            )
            .forEach(function (element) {
                element.textContent = email;
            });

        const initial =
            name.charAt(0).toUpperCase() || "A";

        document
            .querySelectorAll(
                "#adminAvatar, [data-admin-avatar]"
            )
            .forEach(function (element) {
                element.textContent = initial;
            });
    }

    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    async function loadDashboard() {

        setLoading(true);

        hideDashboardErrors();

        try {

            const results =
                await Promise.allSettled([

                    fetchRecords(
                        API.applications,
                        "applications"
                    ),

                    fetchRecords(
                        API.participants,
                        "participants"
                    ),

                    fetchRecords(
                        API.events,
                        "events"
                    ),

                    fetchRecords(
                        API.contacts,
                        "contacts"
                    )
                ]);

            applications =
                results[0].status === "fulfilled"
                    ? results[0].value
                    : [];

            participants =
                results[1].status === "fulfilled"
                    ? results[1].value
                    : [];

            events =
                results[2].status === "fulfilled"
                    ? results[2].value
                    : [];

            contacts =
                results[3].status === "fulfilled"
                    ? results[3].value
                    : [];

            /*
             * IMPORTANT:
             * Loading is hidden even if one API
             * request fails.
             */

            setLoading(false);

            updateDashboardStats();

            renderApplications();
            renderParticipants();
            renderEvents();
            renderContacts();
            renderOverview();

            showPartialErrors(results);

        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );

            setLoading(false);

            showDashboardError(
                getErrorMessage(error)
            );
        }
    }

    /* =====================================================
       FETCH RECORDS
    ===================================================== */

    async function fetchRecords(
        endpoint,
        type
    ) {

        const response =
            await authenticatedFetch(endpoint);

        const result =
            await parseResponse(response);

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleUnauthorized();

            throw new Error(
                "Admin authentication expired."
            );
        }

        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                `Unable to load ${type}. HTTP ${response.status}`
            );
        }

        return extractRecords(
            result,
            type
        );
    }

    /* =====================================================
       EXTRACT API DATA
    ===================================================== */

    function extractRecords(
        result,
        type
    ) {

        if (Array.isArray(result)) {
            return result.map(normalizeRecord);
        }

        if (!result || typeof result !== "object") {
            return [];
        }

        /*
         * Supports many possible backend formats:
         *
         * { applications: [] }
         * { data: [] }
         * { data: { applications: [] } }
         * { results: [] }
         * { records: [] }
         */

        const direct =
            result[type];

        if (Array.isArray(direct)) {
            return direct.map(normalizeRecord);
        }

        if (
            result.data &&
            Array.isArray(result.data)
        ) {
            return result.data.map(
                normalizeRecord
            );
        }

        if (
            result.data &&
            typeof result.data === "object"
        ) {

            const nested =
                result.data[type];

            if (Array.isArray(nested)) {
                return nested.map(
                    normalizeRecord
                );
            }
        }

        if (Array.isArray(result.results)) {
            return result.results.map(
                normalizeRecord
            );
        }

        if (Array.isArray(result.records)) {
            return result.records.map(
                normalizeRecord
            );
        }

        return [];
    }

    /* =====================================================
       AUTHENTICATED FETCH
    ===================================================== */

    async function authenticatedFetch(
        url,
        options = {}
    ) {

        const token =
            getToken();

        const headers = {
            Accept: "application/json",
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization =
                `Bearer ${token}`;
        }

        return fetch(
            url,
            {
                ...options,
                headers
            }
        );
    }

    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        /*
         * Supports BOTH:
         *
         * data-section
         * data-admin-section
         */

        document
            .querySelectorAll(
                "[data-section], [data-admin-section]"
            )
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        const section =
                            link.dataset.section ||
                            link.dataset.adminSection;

                        if (section) {
                            switchSection(section);
                        }
                    }
                );
            });

        const menuButton =
            document.querySelector("#adminMenuToggle");

        const navigation =
            document.querySelector(
                "#adminNavigation"
            ) ||
            document.querySelector(
                ".admin-navigation"
            );

        if (
            menuButton &&
            navigation
        ) {

            menuButton.addEventListener(
                "click",
                function () {

                    navigation.classList.toggle(
                        "open"
                    );
                }
            );
        }
    }

    function switchSection(
        section
    ) {

        currentSection =
            section;

        document
            .querySelectorAll(
                "[data-section], [data-admin-section]"
            )
            .forEach(function (link) {

                const linkSection =
                    link.dataset.section ||
                    link.dataset.adminSection;

                link.classList.toggle(
                    "active",
                    linkSection === section
                );
            });

        /*
         * Supports BOTH dashboard versions.
         */

        document
            .querySelectorAll(
                "[data-section-panel], [data-admin-panel]"
            )
            .forEach(function (panel) {

                const panelSection =
                    panel.dataset.sectionPanel ||
                    panel.dataset.adminPanel;

                panel.classList.toggle(
                    "active",
                    panelSection === section
                );
            });

        switch (section) {

            case "applications":
                renderApplications();
                break;

            case "participants":
                renderParticipants();
                break;

            case "events":
                renderEvents();
                break;

            case "contacts":
                renderContacts();
                break;

            case "overview":
            default:
                renderOverview();
                break;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    /* =====================================================
       FILTERS
    ===================================================== */

    function setupFilters() {

        document
            .querySelectorAll(
                "[data-admin-filter]"
            )
            .forEach(function (filter) {

                filter.addEventListener(
                    "change",
                    renderCurrentSection
                );
            });

        /*
         * Compatibility with existing dashboard IDs.
         */

        [
            "#applicationStatusFilter",
            "#participantStatusFilter",
            "#eventStatusFilter",
            "#contactStatusFilter"
        ].forEach(function (selector) {

            const element =
                document.querySelector(selector);

            if (element) {

                element.addEventListener(
                    "change",
                    renderCurrentSection
                );
            }
        });
    }

    function setupSearch() {

        document
            .querySelectorAll(
                "[data-admin-search]"
            )
            .forEach(function (input) {

                input.addEventListener(
                    "input",
                    debounce(
                        renderCurrentSection,
                        250
                    )
                );
            });

        [
            "#applicationSearch",
            "#participantSearch",
            "#eventSearch",
            "#contactSearch"
        ].forEach(function (selector) {

            const input =
                document.querySelector(selector);

            if (input) {

                input.addEventListener(
                    "input",
                    debounce(
                        renderCurrentSection,
                        250
                    )
                );
            }
        });
    }

    function renderCurrentSection() {

        switch (currentSection) {

            case "applications":
                renderApplications();
                break;

            case "participants":
                renderParticipants();
                break;

            case "events":
                renderEvents();
                break;

            case "contacts":
                renderContacts();
                break;

            default:
                renderOverview();
        }
    }

    /* =====================================================
       OVERVIEW
    ===================================================== */

    function renderOverview() {

        updateDashboardStats();

        const container =
            document.querySelector(
                "#recentApplications"
            ) ||
            document.querySelector(
                "[data-recent-applications]"
            );

        if (!container) {
            return;
        }

        const recent =
            [...applications]
                .sort(function (a, b) {

                    return (
                        getTimestamp(b) -
                        getTimestamp(a)
                    );
                })
                .slice(0, 5);

        if (!recent.length) {

            container.innerHTML =
                createEmptyHTML(
                    "No applications yet."
                );

            return;
        }

        container.innerHTML =
            recent
                .map(createApplicationRow)
                .join("");

        attachRecordActions(container);
    }

    /* =====================================================
       STATISTICS
    ===================================================== */

    function updateDashboardStats() {

        const pending =
            applications.filter(function (record) {

                return isPending(
                    record.status
                );
            }).length;

        const upcoming =
            events.filter(function (record) {

                return normalizeStatus(
                    record.status,
                    record.date ||
                    record.eventDate
                ) === "upcoming";

            }).length;

        updateStat(
            [
                "#totalApplications",
                '[data-stat="applications"]'
            ],
            applications.length
        );

        updateStat(
            [
                "#totalParticipants",
                '[data-stat="participants"]'
            ],
            participants.length
        );

        updateStat(
            [
                "#totalEvents",
                '[data-stat="events"]'
            ],
            events.length
        );

        updateStat(
            [
                "#totalContacts",
                '[data-stat="contacts"]'
            ],
            contacts.length
        );

        updateStat(
            [
                "#pendingApplications",
                '[data-stat="pending-applications"]'
            ],
            pending
        );

        updateStat(
            [
                "#upcomingEvents",
                '[data-stat="upcoming-events"]'
            ],
            upcoming
        );

        /*
         * Sidebar counts.
         */

        updateSidebarCount(
            "applications",
            applications.length
        );

        updateSidebarCount(
            "participants",
            participants.length
        );

        updateSidebarCount(
            "events",
            events.length
        );

        updateSidebarCount(
            "contacts",
            contacts.length
        );
    }

    function updateStat(
        selectors,
        value
    ) {

        selectors.forEach(function (selector) {

            document
                .querySelectorAll(selector)
                .forEach(function (element) {

                    element.textContent =
                        formatNumber(value);
                });
        });
    }

    function updateSidebarCount(
        type,
        value
    ) {

        const idMap = {
            applications:
                "#applicationCount",

            participants:
                "#participantCount",

            events:
                "#eventCount",

            contacts:
                "#contactCount"
        };

        const selector =
            idMap[type];

        if (!selector) {
            return;
        }

        document
            .querySelectorAll(selector)
            .forEach(function (element) {

                element.textContent =
                    formatNumber(value);
            });
    }

    /* =====================================================
       APPLICATIONS
    ===================================================== */

    function renderApplications() {

        const container =
            document.querySelector(
                "#applicationsTableBody"
            ) ||
            document.querySelector(
                '[data-admin-table="applications"]'
            );

        if (!container) {
            return;
        }

        const records =
            filterRecords(
                applications,
                "applications"
            );

        if (!records.length) {

            container.innerHTML =
                createEmptyTableRow(
                    "No applications found."
                );

            updateSectionCount(
                "applications",
                0
            );

            return;
        }

        container.innerHTML =
            records
                .map(createApplicationRow)
                .join("");

        attachRecordActions(container);

        updateSectionCount(
            "applications",
            records.length
        );
    }

    function createApplicationRow(
        record
    ) {

        const id =
            getRecordId(record);

        const name =
            record.name ||
            record.fullName ||
            "Unknown";

        const competition =
            record.competitionName ||
            record.event ||
            record.eventName ||
            "—";

        const sport =
            record.sport ||
            "—";

        const date =
            record.eventDate ||
            record.date ||
            "";

        const status =
            normalizeStatus(
                record.status
            );

        return `
            <tr data-record-id="${escapeHTML(id)}">

                <td>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    ${
                        record.email
                            ? `
                                <small class="table-subtext">
                                    ${escapeHTML(record.email)}
                                </small>
                            `
                            : ""
                    }
                </td>

                <td>
                    ${escapeHTML(competition)}
                </td>

                <td>
                    ${escapeHTML(sport)}
                </td>

                <td>
                    ${
                        date
                            ? formatDate(date)
                            : "—"
                    }
                </td>

                <td>
                    <span class="status-badge ${getStatusClass(status)}">
                        ${escapeHTML(
                            formatStatus(status)
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        formatDateTime(
                            record.createdAt ||
                            record.submittedAt
                        )
                    )}
                </td>

                <td class="table-actions">

                    <button
                        type="button"
                        class="admin-action-btn view"
                        data-action="view"
                        data-record-type="application"
                        data-record-id="${escapeHTML(id)}"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="admin-action-btn delete"
                        data-action="delete"
                        data-record-type="application"
                        data-record-id="${escapeHTML(id)}"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;
    }

    /* =====================================================
       PARTICIPANTS
    ===================================================== */

    function renderParticipants() {

        const container =
            document.querySelector(
                "#participantsTableBody"
            ) ||
            document.querySelector(
                '[data-admin-table="participants"]'
            );

        if (!container) {
            return;
        }

        const records =
            filterRecords(
                participants,
                "participants"
            );

        if (!records.length) {

            container.innerHTML =
                createEmptyTableRow(
                    "No participants found."
                );

            updateSectionCount(
                "participants",
                0
            );

            return;
        }

        container.innerHTML =
            records
                .map(createParticipantRow)
                .join("");

        attachRecordActions(container);

        updateSectionCount(
            "participants",
            records.length
        );
    }

    function createParticipantRow(
        record
    ) {

        const id =
            getRecordId(record);

        const name =
            record.name ||
            record.fullName ||
            record.participantName ||
            "Unknown";

        const event =
            record.eventName ||
            record.event ||
            record.competitionName ||
            "—";

        const sport =
            record.sport ||
            "—";

        const phone =
            record.phone ||
            record.mobile ||
            "—";

        const email =
            record.email ||
            "—";

        return `
            <tr data-record-id="${escapeHTML(id)}">

                <td>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(event)}
                </td>

                <td>
                    ${escapeHTML(sport)}
                </td>

                <td>
                    ${escapeHTML(phone)}
                </td>

                <td>
                    ${escapeHTML(email)}
                </td>

                <td>
                    ${escapeHTML(
                        formatDateTime(
                            record.createdAt ||
                            record.registrationDate
                        )
                    )}
                </td>

                <td class="table-actions">

                    <button
                        type="button"
                        class="admin-action-btn view"
                        data-action="view"
                        data-record-type="participant"
                        data-record-id="${escapeHTML(id)}"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="admin-action-btn delete"
                        data-action="delete"
                        data-record-type="participant"
                        data-record-id="${escapeHTML(id)}"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    function renderEvents() {

        const container =
            document.querySelector(
                "#eventsTableBody"
            ) ||
            document.querySelector(
                '[data-admin-table="events"]'
            );

        if (!container) {
            return;
        }

        const records =
            filterRecords(
                events,
                "events"
            );

        if (!records.length) {

            container.innerHTML =
                createEmptyTableRow(
                    "No events found."
                );

            updateSectionCount(
                "events",
                0
            );

            return;
        }

        container.innerHTML =
            records
                .map(createEventRow)
                .join("");

        attachRecordActions(container);

        updateSectionCount(
            "events",
            records.length
        );
    }

    function createEventRow(
        record
    ) {

        const id =
            getRecordId(record);

        const name =
            record.name ||
            record.eventName ||
            record.title ||
            "SPORTING Event";

        const sport =
            record.sport ||
            "—";

        const date =
            record.date ||
            record.eventDate ||
            "";

        const location =
            record.location ||
            record.venue ||
            "—";

        const status =
            normalizeStatus(
                record.status,
                date
            );

        const participantCount =
            record.participants ??
            record.participantCount ??
            record.registeredParticipants ??
            record.expectedParticipants ??
            0;

        return `
            <tr data-record-id="${escapeHTML(id)}">

                <td>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(sport)}
                </td>

                <td>
                    ${
                        date
                            ? formatDate(date)
                            : "—"
                    }
                </td>

                <td>
                    ${escapeHTML(location)}
                </td>

                <td>
                    ${formatNumber(participantCount)}
                </td>

                <td>
                    <span class="status-badge ${getStatusClass(status)}">
                        ${escapeHTML(
                            formatStatus(status)
                        )}
                    </span>
                </td>

                <td class="table-actions">

                    <button
                        type="button"
                        class="admin-action-btn view"
                        data-action="view"
                        data-record-type="event"
                        data-record-id="${escapeHTML(id)}"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="admin-action-btn delete"
                        data-action="delete"
                        data-record-type="event"
                        data-record-id="${escapeHTML(id)}"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;
    }

    /* =====================================================
       CONTACTS
    ===================================================== */

    function renderContacts() {

        const container =
            document.querySelector(
                "#contactsTableBody"
            ) ||
            document.querySelector(
                '[data-admin-table="contacts"]'
            );

        if (!container) {
            return;
        }

        const records =
            filterRecords(
                contacts,
                "contacts"
            );

        if (!records.length) {

            container.innerHTML =
                createEmptyTableRow(
                    "No contact messages found."
                );

            updateSectionCount(
                "contacts",
                0
            );

            return;
        }

        container.innerHTML =
            records
                .map(createContactRow)
                .join("");

        attachRecordActions(container);

        updateSectionCount(
            "contacts",
            records.length
        );
    }

    function createContactRow(
        record
    ) {

        const id =
            getRecordId(record);

        const name =
            record.name ||
            record.fullName ||
            "Unknown";

        const email =
            record.email ||
            "—";

        const subject =
            record.subject ||
            record.messageSubject ||
            "General enquiry";

        const status =
            normalizeStatus(
                record.status || "new"
            );

        return `
            <tr data-record-id="${escapeHTML(id)}">

                <td>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(email)}
                </td>

                <td>
                    ${escapeHTML(subject)}
                </td>

                <td>
                    <span class="status-badge ${getStatusClass(status)}">
                        ${escapeHTML(
                            formatStatus(status)
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        formatDateTime(
                            record.createdAt ||
                            record.submittedAt
                        )
                    )}
                </td>

                <td class="table-actions">

                    <button
                        type="button"
                        class="admin-action-btn view"
                        data-action="view"
                        data-record-type="contact"
                        data-record-id="${escapeHTML(id)}"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="admin-action-btn delete"
                        data-action="delete"
                        data-record-type="contact"
                        data-record-id="${escapeHTML(id)}"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;
    }

    /* =====================================================
       FILTER RECORDS
    ===================================================== */

    function filterRecords(
        records,
        type
    ) {

        let result =
            [...records];

        const search =
            getSearchValue(type);

        const status =
            getStatusFilter(type);

        const sport =
            getSportFilter(type);

        if (search) {

            result =
                result.filter(function (record) {

                    const text =
                        Object.values(record)
                            .filter(function (value) {

                                return (
                                    typeof value === "string" ||
                                    typeof value === "number"
                                );
                            })
                            .join(" ")
                            .toLowerCase();

                    return text.includes(search);
                });
        }

        if (
            status &&
            status !== "all"
        ) {

            result =
                result.filter(function (record) {

                    return normalizeStatus(
                        record.status,
                        record.date ||
                        record.eventDate
                    ) === status;
                });
        }

        if (
            sport &&
            sport !== "all"
        ) {

            result =
                result.filter(function (record) {

                    return String(
                        record.sport || ""
                    ).toLowerCase() ===
                    sport.toLowerCase();
                });
        }

        if (type === "events") {

            result.sort(function (a, b) {

                return (
                    getTimestamp(
                        a.date ||
                        a.eventDate
                    ) -
                    getTimestamp(
                        b.date ||
                        b.eventDate
                    )
                );
            });

        } else {

            result.sort(function (a, b) {

                return (
                    getTimestamp(b) -
                    getTimestamp(a)
                );
            });
        }

        return result;
    }

    function getSearchValue(
        type
    ) {

        const ids = {
            applications: "#applicationSearch",
            participants: "#participantSearch",
            events: "#eventSearch",
            contacts: "#contactSearch"
        };

        const input =
            document.querySelector(
                ids[type]
            ) ||
            document.querySelector(
                "[data-admin-search]"
            );

        return input
            ? input.value.trim().toLowerCase()
            : "";
    }

    function getStatusFilter(
        type
    ) {

        const ids = {
            applications: "#applicationStatusFilter",
            participants: "#participantStatusFilter",
            events: "#eventStatusFilter",
            contacts: "#contactStatusFilter"
        };

        const element =
            document.querySelector(
                ids[type]
            );

        if (element) {
            return element.value;
        }

        const generic =
            document.querySelector(
                '[data-admin-filter="status"]'
            );

        return generic
            ? generic.value
            : "";
    }

    function getSportFilter() {

        const element =
            document.querySelector(
                "#eventSportFilter"
            ) ||
            document.querySelector(
                '[data-admin-filter="sport"]'
            );

        return element
            ? element.value
            : "";
    }

    /* =====================================================
       ACTIONS
    ===================================================== */

    function attachRecordActions(
        container
    ) {

        container
            .querySelectorAll(
                "[data-action]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const action =
                            button.dataset.action;

                        const type =
                            button.dataset.recordType;

                        const id =
                            button.dataset.recordId;

                        if (action === "view") {
                            viewRecord(type, id);
                        }

                        if (action === "delete") {
                            deleteRecord(type, id);
                        }
                    }
                );
            });
    }

    /* =====================================================
       VIEW RECORD
    ===================================================== */

    function viewRecord(
        type,
        id
    ) {

        const record =
            findRecord(type, id);

        if (!record) {

            showGlobalMessage(
                "Record could not be found.",
                "error"
            );

            return;
        }

        openModal(
            createRecordDetails(
                type,
                record
            )
        );
    }

    function findRecord(
        type,
        id
    ) {

        const map = {
            application: applications,
            participant: participants,
            event: events,
            contact: contacts
        };

        const records =
            map[type] || [];

        return records.find(function (record) {

            return String(
                getRecordId(record)
            ) === String(id);
        });
    }

    /* =====================================================
       DETAILS MODAL
    ===================================================== */

    function createRecordDetails(
        type,
        record
    ) {

        const title =
            getRecordTitle(
                type,
                record
            );

        const rows =
            Object.entries(record)
                .filter(function ([key]) {

                    return (
                        key !== "raw" &&
                        key !== "__v"
                    );
                })
                .map(function ([key, value]) {

                    return createDetailRow(
                        key,
                        value
                    );
                })
                .join("");

        return `
            <div class="admin-detail-modal">

                <div class="admin-detail-header">

                    <span class="admin-detail-type">
                        ${escapeHTML(
                            formatRecordType(type)
                        )}
                    </span>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                </div>

                <div class="admin-detail-list">
                    ${rows}
                </div>

            </div>
        `;
    }

    function createDetailRow(
        key,
        value
    ) {

        let displayValue =
            value;

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            displayValue = "—";

        } else if (
            typeof value === "object"
        ) {

            try {

                displayValue =
                    JSON.stringify(
                        value,
                        null,
                        2
                    );

            } catch (error) {

                displayValue =
                    String(value);
            }
        }

        return `
            <div class="admin-detail-row">

                <strong>
                    ${escapeHTML(
                        humanizeKey(key)
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        String(displayValue)
                    )}
                </span>

            </div>
        `;
    }

    function getRecordTitle(
        type,
        record
    ) {

        return (
            record.name ||
            record.fullName ||
            record.eventName ||
            record.competitionName ||
            record.title ||
            record.subject ||
            `${formatRecordType(type)} Details`
        );
    }

    function formatRecordType(
        type
    ) {

        const map = {
            application: "Event Application",
            participant: "Participant",
            event: "Event",
            contact: "Contact Message"
        };

        return (
            map[type] ||
            "Record"
        );
    }

    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteRecord(
        type,
        id
    ) {

        const record =
            findRecord(
                type,
                id
            );

        if (!record) {
            return;
        }

        const title =
            getRecordTitle(
                type,
                record
            );

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${title}"? This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        const endpoint =
            getEndpointForType(type);

        try {

            const response =
                await authenticatedFetch(
                    `${endpoint}/${encodeURIComponent(id)}`,
                    {
                        method: "DELETE"
                    }
                );

            const result =
                await parseResponse(response);

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                handleUnauthorized();
                return;
            }

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Unable to delete record."
                );
            }

            removeLocalRecord(
                type,
                id
            );

            updateDashboardStats();

            renderCurrentSection();

            showGlobalMessage(
                "Record deleted successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Delete error:",
                error
            );

            showGlobalMessage(
                getErrorMessage(error),
                "error"
            );
        }
    }

    function getEndpointForType(
        type
    ) {

        const map = {
            application: API.applications,
            participant: API.participants,
            event: API.events,
            contact: API.contacts
        };

        return map[type];
    }

    function removeLocalRecord(
        type,
        id
    ) {

        const filter =
            function (record) {

                return (
                    String(
                        getRecordId(record)
                    ) !== String(id)
                );
            };

        if (type === "application") {
            applications =
                applications.filter(filter);
        }

        if (type === "participant") {
            participants =
                participants.filter(filter);
        }

        if (type === "event") {
            events =
                events.filter(filter);
        }

        if (type === "contact") {
            contacts =
                contacts.filter(filter);
        }
    }

    /* =====================================================
       MODAL
    ===================================================== */

    function setupModal() {

        document
            .querySelectorAll(
                "#modalClose, [data-modal-close]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    closeModal
                );
            });

        const modal =
            document.querySelector(
                "#adminModal"
            );

        if (!modal) {
            return;
        }

        const overlay =
            modal.querySelector(
                ".admin-modal-overlay"
            );

        if (overlay) {

            overlay.addEventListener(
                "click",
                closeModal
            );
        }
    }

    function openModal(
        content
    ) {

        const modal =
            document.querySelector(
                "#adminModal"
            );

        if (!modal) {
            return;
        }

        const body =
            modal.querySelector(
                "#modalBody"
            ) ||
            modal.querySelector(
                ".admin-modal-content"
            );

        if (body) {
            body.innerHTML = content;
        }

        const title =
            modal.querySelector(
                "#modalTitle"
            );

        if (title) {
            title.textContent = "Record Details";
        }

        modal.classList.add("active");

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeModal() {

        const modal =
            document.querySelector(
                "#adminModal"
            );

        if (!modal) {
            return;
        }

        modal.classList.remove("active");

        document.body.classList.remove(
            "modal-open"
        );
    }

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {
                closeModal();
            }
        }
    );

    /* =====================================================
       LOGOUT
    ===================================================== */

    function setupLogout() {

        document
            .querySelectorAll(
                "#logoutBtn, #adminLogout, [data-admin-logout]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    handleLogout
                );
            });
    }

    function handleLogout(
        event
    ) {

        if (event) {
            event.preventDefault();
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmed) {
            return;
        }

        removeToken();

        window.location.href =
            "admin-login.html";
    }

    /* =====================================================
       UNAUTHORIZED
    ===================================================== */

    function handleUnauthorized() {

        removeToken();

        window.location.href =
            "admin-login.html?expired=true";
    }

    /* =====================================================
       LOADING FIX
    ===================================================== */

    function setLoading(
        loading
    ) {

        /*
         * Hide/show every dashboard loading element.
         */

        document
            .querySelectorAll(
                "[data-dashboard-loading]"
            )
            .forEach(function (element) {

                element.classList.toggle(
                    "active",
                    loading
                );

                element.style.display =
                    loading
                        ? ""
                        : "none";
            });

        /*
         * Also support common loading IDs/classes.
         */

        document
            .querySelectorAll(
                ".dashboard-loading, .admin-loading"
            )
            .forEach(function (element) {

                element.classList.toggle(
                    "active",
                    loading
                );

                if (!loading) {
                    element.style.display = "none";
                }
            });
    }

    function showDashboardLoading() {
        setLoading(true);
    }

    function hideDashboardLoading() {
        setLoading(false);
    }

    /* =====================================================
       ERROR HANDLING
    ===================================================== */

    function hideDashboardErrors() {

        document
            .querySelectorAll(
                "[data-dashboard-error]"
            )
            .forEach(function (element) {

                element.classList.remove(
                    "active"
                );

                element.textContent = "";
            });
    }

    function showDashboardError(
        message
    ) {

        document
            .querySelectorAll(
                "[data-dashboard-error]"
            )
            .forEach(function (element) {

                element.textContent =
                    message;

                element.classList.add(
                    "active"
                );
            });

        showGlobalMessage(
            message,
            "error"
        );
    }

    function showPartialErrors(
        results
    ) {

        const names = [
            "Applications",
            "Participants",
            "Events",
            "Contacts"
        ];

        const failed =
            [];

        results.forEach(
            function (result, index) {

                if (
                    result.status ===
                    "rejected"
                ) {

                    failed.push(
                        names[index]
                    );
                }
            }
        );

        if (failed.length) {

            console.warn(
                "Some dashboard sections failed:",
                failed
            );

            showGlobalMessage(
                `${failed.join(", ")} could not be loaded. Other dashboard data is available.`,
                "error"
            );
        }
    }

    /* =====================================================
       EMPTY STATES
    ===================================================== */

    function createEmptyHTML(
        message
    ) {

        return `
            <div class="admin-empty">

                <div class="admin-empty-icon">
                    —
                </div>

                <h3>
                    ${escapeHTML(message)}
                </h3>

            </div>
        `;
    }

    function createEmptyTableRow(
        message
    ) {

        return `
            <tr>

                <td
                    colspan="10"
                    class="admin-empty-cell"
                >
                    ${escapeHTML(message)}
                </td>

            </tr>
        `;
    }

    /* =====================================================
       GLOBAL MESSAGE
    ===================================================== */

    function showGlobalMessage(
        message,
        type
    ) {

        let element =
            document.querySelector(
                "#adminToast"
            ) ||
            document.querySelector(
                "#adminGlobalMessage"
            );

        if (!element) {

            element =
                document.createElement(
                    "div"
                );

            element.id =
                "adminGlobalMessage";

            element.className =
                "admin-global-message";

            document.body.appendChild(
                element
            );
        }

        element.textContent =
            message;

        element.className =
            `admin-global-message ${type || ""} active`;

        setTimeout(function () {

            element.classList.remove(
                "active"
            );

        }, 4500);
    }

    /* =====================================================
       LOGIN MESSAGE
    ===================================================== */

    function showAdminMessage(
        form,
        message,
        type
    ) {

        let element =
            form.querySelector(
                "#loginMessage"
            ) ||
            form.querySelector(
                ".admin-message"
            );

        if (!element) {

            element =
                document.createElement(
                    "div"
                );

            element.className =
                "admin-message";

            form.insertBefore(
                element,
                form.firstChild
            );
        }

        element.textContent =
            message;

        element.className =
            `admin-message ${type || ""}`;

        element.setAttribute(
            "role",
            "alert"
        );
    }

    function clearAdminMessage(
        form
    ) {

        const element =
            form.querySelector(
                "#loginMessage"
            ) ||
            form.querySelector(
                ".admin-message"
            );

        if (element) {

            element.textContent = "";

            element.className =
                "admin-message";
        }
    }

    /* =====================================================
       SECTION COUNTS
    ===================================================== */

    function updateSectionCount(
        section,
        count
    ) {

        const selectors = [
            `[data-admin-count="${section}"]`
        ];

        const idMap = {
            applications:
                "#applicationCount",

            participants:
                "#participantCount",

            events:
                "#eventCount",

            contacts:
                "#contactCount"
        };

        if (idMap[section]) {
            selectors.push(
                idMap[section]
            );
        }

        selectors.forEach(function (selector) {

            document
                .querySelectorAll(selector)
                .forEach(function (element) {

                    element.textContent =
                        formatNumber(count);
                });
        });
    }

    /* =====================================================
       NORMALIZE RECORD
    ===================================================== */

    function normalizeRecord(
        record
    ) {

        if (
            !record ||
            typeof record !== "object"
        ) {
            return {};
        }

        return {
            ...record,

            id:
                record.id ||
                record._id ||
                record.applicationId ||
                record.participantId ||
                record.eventId ||
                record.contactId ||
                ""
        };
    }

    function getRecordId(
        record
    ) {

        return String(
            record?.id ||
            record?._id ||
            record?.applicationId ||
            record?.participantId ||
            record?.eventId ||
            record?.contactId ||
            ""
        );
    }

    /* =====================================================
       STATUS
    ===================================================== */

    function normalizeStatus(
        status,
        date
    ) {

        const value =
            String(status || "")
                .toLowerCase()
                .trim();

        if (value.includes("cancel")) {
            return "cancelled";
        }

        if (
            value.includes("complete") ||
            value.includes("finish") ||
            value.includes("past")
        ) {
            return "completed";
        }

        if (
            value.includes("ongoing") ||
            value.includes("running") ||
            value.includes("live")
        ) {
            return "ongoing";
        }

        if (value.includes("approve")) {
            return "approved";
        }

        if (value.includes("reject")) {
            return "rejected";
        }

        if (value.includes("pending")) {
            return "pending";
        }

        if (value.includes("new")) {
            return "new";
        }

        if (
            value.includes("open") ||
            value.includes("upcoming")
        ) {
            return "upcoming";
        }

        if (date) {

            const eventDate =
                new Date(date);

            if (
                !Number.isNaN(
                    eventDate.getTime()
                )
            ) {

                const today =
                    new Date();

                today.setHours(
                    0,
                    0,
                    0,
                    0
                );

                eventDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                if (
                    eventDate < today
                ) {
                    return "completed";
                }

                return "upcoming";
            }
        }

        return "new";
    }

    function isPending(
        status
    ) {

        return (
            normalizeStatus(status) ===
            "pending"
        );
    }

    function formatStatus(
        status
    ) {

        const map = {
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            upcoming: "Upcoming",
            ongoing: "Ongoing",
            completed: "Completed",
            cancelled: "Cancelled",
            new: "New"
        };

        return (
            map[status] ||
            capitalize(status || "New")
        );
    }

    function getStatusClass(
        status
    ) {

        return (
            `status-${String(
                status || "new"
            ).toLowerCase()}`
        );
    }

    /* =====================================================
       DATE HELPERS
    ===================================================== */

    function formatDate(
        value
    ) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).format(date);
    }

    function formatDateTime(
        value
    ) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);
    }

    function getTimestamp(
        record
    ) {

        const value =
            typeof record === "object"
                ? (
                    record.createdAt ||
                    record.updatedAt ||
                    record.date ||
                    record.eventDate ||
                    record.registrationDate ||
                    ""
                )
                : record;

        const timestamp =
            new Date(value).getTime();

        return Number.isNaN(timestamp)
            ? 0
            : timestamp;
    }

    function formatNumber(
        value
    ) {

        const number =
            Number(value);

        if (Number.isNaN(number)) {
            return "0";
        }

        return new Intl.NumberFormat(
            "en-IN"
        ).format(number);
    }

    /* =====================================================
       STRING HELPERS
    ===================================================== */

    function humanizeKey(
        key
    ) {

        return String(key)
            .replace(
                /([A-Z])/g,
                " $1"
            )
            .replace(
                /[_-]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .replace(
                /^./,
                function (char) {
                    return char.toUpperCase();
                }
            );
    }

    function capitalize(
        value
    ) {

        if (!value) {
            return "";
        }

        return (
            String(value).charAt(0).toUpperCase() +
            String(value).slice(1)
        );
    }

    /* =====================================================
       BUTTON HELPERS
    ===================================================== */

    function getButtonText(
        button
    ) {

        if (!button) {
            return "";
        }

        return (
            button.dataset.originalText ||
            button.textContent ||
            button.value ||
            ""
        ).trim();
    }

    function setButtonLoading(
        button,
        loading,
        text
    ) {

        if (!button) {
            return;
        }

        if (loading) {

            button.dataset.originalText =
                getButtonText(button);

            button.disabled = true;

            if (
                button.tagName.toLowerCase() ===
                "input"
            ) {
                button.value = text;
            } else {
                button.textContent = text;
            }

            button.classList.add(
                "is-loading"
            );

        } else {

            button.disabled = false;

            const original =
                button.dataset.originalText ||
                text;

            if (
                button.tagName.toLowerCase() ===
                "input"
            ) {
                button.value = original;
            } else {
                button.textContent = original;
            }

            button.classList.remove(
                "is-loading"
            );
        }
    }

    /* =====================================================
       EMAIL
    ===================================================== */

    function isValidEmail(
        email
    ) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );
    }

    /* =====================================================
       RESPONSE PARSER
    ===================================================== */

    async function parseResponse(
        response
    ) {

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            try {
                return await response.json();
            } catch (error) {
                return {};
            }
        }

        const text =
            await response.text();

        return {
            message: text
        };
    }

    /* =====================================================
       ERROR MESSAGE
    ===================================================== */

    function getErrorMessage(
        error
    ) {

        if (
            error?.message &&
            (
                error.message.includes(
                    "Failed to fetch"
                ) ||
                error.message.includes(
                    "NetworkError"
                )
            )
        ) {

            return (
                "Unable to connect to the SPORTING server. Make sure the backend is running on port 5000."
            );
        }

        return (
            error?.message ||
            "Something went wrong. Please try again."
        );
    }

    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    /* =====================================================
       DEBOUNCE
    ===================================================== */

    function debounce(
        callback,
        delay
    ) {

        let timeout;

        return function () {

            const context =
                this;

            const args =
                arguments;

            clearTimeout(timeout);

            timeout =
                setTimeout(
                    function () {

                        callback.apply(
                            context,
                            args
                        );

                    },
                    delay
                );
        };
    }

    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.SPORTING_ADMIN = {

        API,

        login:
            handleLogin,

        logout:
            handleLogout,

        loadDashboard:
            loadDashboard,

        refresh:
            loadDashboard,

        switchSection:
            switchSection,

        viewRecord:
            viewRecord,

        deleteRecord:
            deleteRecord,

        getToken:
            getToken,

        getAdmin:
            getAdmin,

        isAuthenticated:
            function () {
                return Boolean(
                    getToken()
                );
            }
    };

})();