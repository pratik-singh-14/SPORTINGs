/*
=========================================================
 SPORTING - EVENTS JAVASCRIPT
 File: frontend/js/events.js

 Features:
 - Load events from backend
 - Display upcoming and past events
 - Search events
 - Filter by sport
 - Filter by status
 - Filter by date
 - Event details
 - Participant registration links
 - Loading / empty / error states
 - Works with both API data and fallback demo events
=========================================================
*/

(function () {
    "use strict";

    const API_BASE_URL =
        window.SPORTING_API_BASE_URL ||
        "http://localhost:5000";

    const EVENTS_ENDPOINT =
        `${API_BASE_URL}/api/events`;

    let allEvents = [];
    let filteredEvents = [];

    document.addEventListener("DOMContentLoaded", () => {
        initializeEventsPage();
    });

    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initializeEventsPage() {
        const eventsContainer =
            document.querySelector("#eventsContainer") ||
            document.querySelector("#eventsGrid") ||
            document.querySelector(
                '[data-events-container]'
            );

        if (!eventsContainer) {
            return;
        }

        setupEventFilters();
        setupSearch();

        showLoading(eventsContainer);

        try {
            await loadEvents();
        } catch (error) {
            console.error(
                "SPORTING events error:",
                error
            );

            /*
             * Keep the page usable during frontend development
             * even when the backend is not running.
             */
            allEvents = getDemoEvents();
            filteredEvents = [...allEvents];

            renderEvents(
                eventsContainer,
                filteredEvents
            );

            showEventsNotice(
                eventsContainer,
                "Live event data is currently unavailable. Showing sample events.",
                "warning"
            );
        }
    }

    /* =====================================================
       LOAD EVENTS FROM BACKEND
    ===================================================== */

    async function loadEvents() {
        const response =
            await fetch(EVENTS_ENDPOINT, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

        if (!response.ok) {
            throw new Error(
                `Events request failed: ${response.status}`
            );
        }

        const result =
            await parseResponse(response);

        const events =
            Array.isArray(result)
                ? result
                : (
                    result.events ||
                    result.data ||
                    result.results ||
                    []
                );

        allEvents =
            events.map(normalizeEvent);

        filteredEvents =
            [...allEvents];

        renderCurrentEvents();
        populateSportFilter();
    }

    /* =====================================================
       NORMALIZE EVENT
    ===================================================== */

    function normalizeEvent(event) {
        const normalized = {
            id:
                event._id ||
                event.id ||
                event.eventId ||
                "",

            name:
                event.name ||
                event.eventName ||
                event.title ||
                "SPORTING Event",

            sport:
                event.sport ||
                event.sports ||
                "Sports",

            category:
                event.category ||
                event.eventCategory ||
                "",

            description:
                event.description ||
                event.details ||
                event.message ||
                "",

            date:
                event.date ||
                event.eventDate ||
                event.startDate ||
                "",

            endDate:
                event.endDate ||
                event.eventEndDate ||
                "",

            time:
                event.time ||
                event.eventTime ||
                "",

            location:
                event.location ||
                event.venue ||
                event.address ||
                "Location to be announced",

            city:
                event.city ||
                "",

            state:
                event.state ||
                "",

            participants:
                event.participants ||
                event.expectedParticipants ||
                event.participantCount ||
                0,

            maxParticipants:
                event.maxParticipants ||
                event.capacity ||
                0,

            status:
                event.status ||
                getAutomaticStatus(event.date),

            registrationOpen:
                event.registrationOpen !== false,

            registrationDeadline:
                event.registrationDeadline ||
                "",

            image:
                event.image ||
                event.imageUrl ||
                event.banner ||
                "",

            organizer:
                event.organizer ||
                "SPORTING",

            registrationFee:
                event.registrationFee ||
                event.fee ||
                0,

            createdAt:
                event.createdAt ||
                "",

            raw:
                event
        };

        normalized.status =
            normalizeStatus(
                normalized.status,
                normalized.date
            );

        return normalized;
    }

    /* =====================================================
       AUTOMATIC STATUS
    ===================================================== */

    function getAutomaticStatus(date) {
        if (!date) {
            return "upcoming";
        }

        const eventDate =
            new Date(date);

        if (
            Number.isNaN(
                eventDate.getTime()
            )
        ) {
            return "upcoming";
        }

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

        if (eventDate < today) {
            return "completed";
        }

        return "upcoming";
    }

    /* =====================================================
       NORMALIZE STATUS
    ===================================================== */

    function normalizeStatus(
        status,
        date
    ) {
        const value =
            String(status || "")
                .toLowerCase()
                .trim();

        if (
            value.includes("cancel")
        ) {
            return "cancelled";
        }

        if (
            value.includes("complete") ||
            value.includes("past") ||
            value.includes("finish")
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

        if (
            value.includes("upcoming") ||
            value.includes("open")
        ) {
            return "upcoming";
        }

        return getAutomaticStatus(date);
    }

    /* =====================================================
       RENDER CURRENT EVENTS
    ===================================================== */

    function renderCurrentEvents() {
        const container =
            document.querySelector(
                "#eventsContainer"
            ) ||
            document.querySelector(
                "#eventsGrid"
            ) ||
            document.querySelector(
                '[data-events-container]'
            );

        if (!container) {
            return;
        }

        applyFilters();

        renderEvents(
            container,
            filteredEvents
        );
    }

    /* =====================================================
       RENDER EVENTS
    ===================================================== */

    function renderEvents(
        container,
        events
    ) {
        if (!container) {
            return;
        }

        if (!events.length) {
            showEmptyState(container);
            updateEventCount(0);
            return;
        }

        /*
         * Use cards by default.
         */

        container.innerHTML =
            events
                .map(createEventCard)
                .join("");

        updateEventCount(
            events.length
        );

        attachEventCardListeners(
            container
        );

        initializeEventImages(
            container
        );
    }

    /* =====================================================
       EVENT CARD
    ===================================================== */

    function createEventCard(event) {
        const eventId =
            escapeHTML(
                String(event.id || "")
            );

        const image =
            event.image
                ? escapeHTML(event.image)
                : getDefaultEventImage(
                    event.sport
                );

        const formattedDate =
            formatDate(event.date);

        const status =
            event.status || "upcoming";

        const statusLabel =
            formatStatus(status);

        const registrationButton =
            canRegister(event)
                ? `
                    <a
                        href="register.html?event=${encodeURIComponent(event.id || event.name)}"
                        class="btn btn-primary event-register-btn"
                        data-event-id="${eventId}"
                    >
                        Register Now
                    </a>
                `
                : `
                    <button
                        type="button"
                        class="btn btn-secondary event-register-btn"
                        disabled
                    >
                        Registration Closed
                    </button>
                `;

        return `
            <article
                class="event-card"
                data-event-id="${eventId}"
                data-status="${escapeHTML(status)}"
                data-sport="${escapeHTML(event.sport)}"
            >

                <div class="event-card-image">

                    <img
                        src="${image}"
                        alt="${escapeHTML(event.name)}"
                        loading="lazy"
                        class="event-image"
                    >

                    <span class="event-status ${getStatusClass(status)}">
                        ${escapeHTML(statusLabel)}
                    </span>

                </div>

                <div class="event-card-content">

                    <div class="event-meta">

                        <span>
                            ${escapeHTML(event.sport)}
                        </span>

                        ${
                            event.category
                                ? `
                                    <span>
                                        ${escapeHTML(event.category)}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                    <h3 class="event-title">
                        ${escapeHTML(event.name)}
                    </h3>

                    ${
                        event.description
                            ? `
                                <p class="event-description">
                                    ${escapeHTML(
                                        truncateText(
                                            event.description,
                                            140
                                        )
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <div class="event-details">

                        <div class="event-detail">
                            <strong>Date</strong>
                            <span>
                                ${escapeHTML(formattedDate)}
                            </span>
                        </div>

                        ${
                            event.time
                                ? `
                                    <div class="event-detail">
                                        <strong>Time</strong>
                                        <span>
                                            ${escapeHTML(event.time)}
                                        </span>
                                    </div>
                                `
                                : ""
                        }

                        <div class="event-detail">
                            <strong>Location</strong>
                            <span>
                                ${escapeHTML(
                                    getEventLocation(event)
                                )}
                            </span>
                        </div>

                        ${
                            event.participants
                                ? `
                                    <div class="event-detail">
                                        <strong>Participants</strong>
                                        <span>
                                            ${formatNumber(
                                                event.participants
                                            )}
                                        </span>
                                    </div>
                                `
                                : ""
                        }

                    </div>

                    <div class="event-card-actions">

                        <button
                            type="button"
                            class="btn btn-outline event-details-btn"
                            data-event-id="${eventId}"
                        >
                            View Details
                        </button>

                        ${registrationButton}

                    </div>

                </div>

            </article>
        `;
    }

    /* =====================================================
       ATTACH CARD LISTENERS
    ===================================================== */

    function attachEventCardListeners(
        container
    ) {
        const detailButtons =
            container.querySelectorAll(
                ".event-details-btn"
            );

        detailButtons.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const eventId =
                        button.dataset.eventId;

                    openEventDetails(
                        eventId
                    );
                }
            );
        });

        const registerButtons =
            container.querySelectorAll(
                ".event-register-btn"
            );

        registerButtons.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const eventId =
                        button.dataset.eventId;

                    if (eventId) {
                        saveSelectedEvent(
                            eventId
                        );
                    }
                }
            );
        });
    }

    /* =====================================================
       EVENT DETAILS MODAL
    ===================================================== */

    function openEventDetails(
        eventId
    ) {
        const event =
            allEvents.find(
                item =>
                    String(item.id) ===
                    String(eventId)
            );

        if (!event) {
            return;
        }

        let modal =
            document.querySelector(
                "#eventDetailsModal"
            );

        if (!modal) {
            modal =
                createEventModal();

            document.body.appendChild(
                modal
            );
        }

        const content =
            modal.querySelector(
                ".event-modal-content"
            );

        if (!content) {
            return;
        }

        content.innerHTML =
            createEventDetailsHTML(
                event
            );

        modal.classList.add(
            "active"
        );

        document.body.classList.add(
            "modal-open"
        );

        attachModalListeners(
            modal,
            event
        );
    }

    /* =====================================================
       CREATE EVENT MODAL
    ===================================================== */

    function createEventModal() {
        const modal =
            document.createElement("div");

        modal.id =
            "eventDetailsModal";

        modal.className =
            "event-modal";

        modal.innerHTML = `
            <div class="event-modal-overlay"></div>

            <div
                class="event-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="eventModalTitle"
            >

                <button
                    type="button"
                    class="event-modal-close"
                    aria-label="Close event details"
                >
                    &times;
                </button>

                <div class="event-modal-content"></div>

            </div>
        `;

        return modal;
    }

    /* =====================================================
       EVENT DETAILS HTML
    ===================================================== */

    function createEventDetailsHTML(
        event
    ) {
        const image =
            event.image
                ? escapeHTML(event.image)
                : getDefaultEventImage(
                    event.sport
                );

        return `
            <div class="event-modal-image">
                <img
                    src="${image}"
                    alt="${escapeHTML(event.name)}"
                >
            </div>

            <div class="event-modal-body">

                <div class="event-modal-status">
                    <span class="event-status ${getStatusClass(event.status)}">
                        ${escapeHTML(
                            formatStatus(
                                event.status
                            )
                        )}
                    </span>
                </div>

                <h2 id="eventModalTitle">
                    ${escapeHTML(event.name)}
                </h2>

                <div class="event-modal-grid">

                    <div>
                        <strong>Sport</strong>
                        <span>
                            ${escapeHTML(event.sport)}
                        </span>
                    </div>

                    ${
                        event.category
                            ? `
                                <div>
                                    <strong>Category</strong>
                                    <span>
                                        ${escapeHTML(
                                            event.category
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                    <div>
                        <strong>Date</strong>
                        <span>
                            ${escapeHTML(
                                formatDate(
                                    event.date
                                )
                            )}
                        </span>
                    </div>

                    ${
                        event.endDate
                            ? `
                                <div>
                                    <strong>End Date</strong>
                                    <span>
                                        ${escapeHTML(
                                            formatDate(
                                                event.endDate
                                            )
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                    ${
                        event.time
                            ? `
                                <div>
                                    <strong>Time</strong>
                                    <span>
                                        ${escapeHTML(
                                            event.time
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                    <div>
                        <strong>Location</strong>
                        <span>
                            ${escapeHTML(
                                getEventLocation(
                                    event
                                )
                            )}
                        </span>
                    </div>

                    ${
                        event.participants
                            ? `
                                <div>
                                    <strong>Participants</strong>
                                    <span>
                                        ${formatNumber(
                                            event.participants
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                    ${
                        event.maxParticipants
                            ? `
                                <div>
                                    <strong>Maximum Capacity</strong>
                                    <span>
                                        ${formatNumber(
                                            event.maxParticipants
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                    ${
                        event.registrationFee
                            ? `
                                <div>
                                    <strong>Registration Fee</strong>
                                    <span>
                                        ₹${formatNumber(
                                            event.registrationFee
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                    ${
                        event.registrationDeadline
                            ? `
                                <div>
                                    <strong>Registration Deadline</strong>
                                    <span>
                                        ${escapeHTML(
                                            formatDate(
                                                event.registrationDeadline
                                            )
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                </div>

                ${
                    event.description
                        ? `
                            <div class="event-modal-description">
                                <h3>About This Event</h3>
                                <p>
                                    ${escapeHTML(
                                        event.description
                                    )}
                                </p>
                            </div>
                        `
                        : ""
                }

                <div class="event-modal-actions">

                    ${
                        canRegister(event)
                            ? `
                                <a
                                    href="register.html?event=${encodeURIComponent(event.id || event.name)}"
                                    class="btn btn-primary modal-register-btn"
                                >
                                    Register Now
                                </a>
                            `
                            : `
                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    disabled
                                >
                                    Registration Closed
                                </button>
                            `
                    }

                </div>

            </div>
        `;
    }

    /* =====================================================
       MODAL LISTENERS
    ===================================================== */

    function attachModalListeners(
        modal,
        event
    ) {
        const closeButton =
            modal.querySelector(
                ".event-modal-close"
            );

        const overlay =
            modal.querySelector(
                ".event-modal-overlay"
            );

        if (closeButton) {
            closeButton.onclick =
                closeEventModal;
        }

        if (overlay) {
            overlay.onclick =
                closeEventModal;
        }

        const registerButton =
            modal.querySelector(
                ".modal-register-btn"
            );

        if (registerButton) {
            registerButton.addEventListener(
                "click",
                () => {
                    saveSelectedEvent(
                        event.id
                    );
                }
            );
        }
    }

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeEventModal() {
        const modal =
            document.querySelector(
                "#eventDetailsModal"
            );

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "active"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    /* =====================================================
       KEYBOARD MODAL CONTROL
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape"
            ) {
                closeEventModal();
            }
        }
    );

    /* =====================================================
       FILTERS
    ===================================================== */

    function setupEventFilters() {
        const filterInputs =
            document.querySelectorAll(
                '[data-event-filter], ' +
                '#eventStatusFilter, ' +
                '#sportFilter, ' +
                '#eventDateFilter'
            );

        filterInputs.forEach(input => {
            input.addEventListener(
                "change",
                applyFilters
            );
        });

        const clearButton =
            document.querySelector(
                "#clearEventFilters"
            );

        if (clearButton) {
            clearButton.addEventListener(
                "click",
                clearFilters
            );
        }
    }

    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearch() {
        const searchInput =
            document.querySelector(
                "#eventSearch"
            ) ||
            document.querySelector(
                '[data-event-search]'
            );

        if (!searchInput) {
            return;
        }

        searchInput.addEventListener(
            "input",
            debounce(
                applyFilters,
                250
            )
        );
    }

    /* =====================================================
       APPLY FILTERS
    ===================================================== */

    function applyFilters() {
        const searchInput =
            document.querySelector(
                "#eventSearch"
            ) ||
            document.querySelector(
                '[data-event-search]'
            );

        const statusFilter =
            document.querySelector(
                "#eventStatusFilter"
            ) ||
            document.querySelector(
                '[data-event-filter="status"]'
            );

        const sportFilter =
            document.querySelector(
                "#sportFilter"
            ) ||
            document.querySelector(
                '[data-event-filter="sport"]'
            );

        const dateFilter =
            document.querySelector(
                "#eventDateFilter"
            ) ||
            document.querySelector(
                '[data-event-filter="date"]'
            );

        const search =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        const status =
            statusFilter
                ? statusFilter.value
                : "";

        const sport =
            sportFilter
                ? sportFilter.value
                : "";

        const date =
            dateFilter
                ? dateFilter.value
                : "";

        filteredEvents =
            allEvents.filter(event => {

                const searchableText =
                    [
                        event.name,
                        event.sport,
                        event.category,
                        event.description,
                        event.location,
                        event.city
                    ]
                        .join(" ")
                        .toLowerCase();

                if (
                    search &&
                    !searchableText.includes(
                        search
                    )
                ) {
                    return false;
                }

                if (
                    status &&
                    status !== "all" &&
                    event.status !== status
                ) {
                    return false;
                }

                if (
                    sport &&
                    sport !== "all" &&
                    event.sport.toLowerCase() !==
                        sport.toLowerCase()
                ) {
                    return false;
                }

                if (
                    date &&
                    event.date
                ) {
                    const eventDate =
                        new Date(event.date)
                            .toISOString()
                            .split("T")[0];

                    if (
                        eventDate !== date
                    ) {
                        return false;
                    }
                }

                return true;
            });

        renderCurrentFilteredEvents();
    }

    /* =====================================================
       RENDER FILTERED EVENTS
    ===================================================== */

    function renderCurrentFilteredEvents() {
        const container =
            document.querySelector(
                "#eventsContainer"
            ) ||
            document.querySelector(
                "#eventsGrid"
            ) ||
            document.querySelector(
                '[data-events-container]'
            );

        if (!container) {
            return;
        }

        renderEvents(
            container,
            filteredEvents
        );
    }

    /* =====================================================
       POPULATE SPORT FILTER
    ===================================================== */

    function populateSportFilter() {
        const select =
            document.querySelector(
                "#sportFilter"
            );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        const sports =
            [
                ...new Set(
                    allEvents
                        .map(
                            event =>
                                event.sport
                        )
                        .filter(Boolean)
                )
            ]
                .sort();

        /*
         * Keep existing "All Sports" option.
         */

        select.innerHTML = `
            <option value="">
                All Sports
            </option>
        `;

        sports.forEach(sport => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                sport;

            option.textContent =
                sport;

            select.appendChild(
                option
            );
        });

        if (
            sports.includes(
                currentValue
            )
        ) {
            select.value =
                currentValue;
        }
    }

    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    function clearFilters() {
        const searchInput =
            document.querySelector(
                "#eventSearch"
            );

        const statusFilter =
            document.querySelector(
                "#eventStatusFilter"
            );

        const sportFilter =
            document.querySelector(
                "#sportFilter"
            );

        const dateFilter =
            document.querySelector(
                "#eventDateFilter"
            );

        if (searchInput) {
            searchInput.value = "";
        }

        if (statusFilter) {
            statusFilter.value = "";
        }

        if (sportFilter) {
            sportFilter.value = "";
        }

        if (dateFilter) {
            dateFilter.value = "";
        }

        filteredEvents =
            [...allEvents];

        renderCurrentFilteredEvents();
    }

    /* =====================================================
       REGISTRATION CHECK
    ===================================================== */

    function canRegister(event) {
        if (
            event.status ===
            "completed"
        ) {
            return false;
        }

        if (
            event.status ===
            "cancelled"
        ) {
            return false;
        }

        if (
            event.registrationOpen ===
            false
        ) {
            return false;
        }

        if (
            event.registrationDeadline
        ) {
            const deadline =
                new Date(
                    event.registrationDeadline
                );

            if (
                !Number.isNaN(
                    deadline.getTime()
                ) &&
                new Date() >
                    deadline
            ) {
                return false;
            }
        }

        if (
            event.maxParticipants &&
            Number(event.participants) >=
                Number(event.maxParticipants)
        ) {
            return false;
        }

        return true;
    }

    /* =====================================================
       SAVE SELECTED EVENT
    ===================================================== */

    function saveSelectedEvent(
        eventId
    ) {
        try {
            localStorage.setItem(
                "SPORTING_SELECTED_EVENT",
                String(eventId)
            );
        } catch (error) {
            console.warn(
                "Unable to save selected event.",
                error
            );
        }
    }

    /* =====================================================
       EMPTY STATE
    ===================================================== */

    function showEmptyState(
        container
    ) {
        container.innerHTML = `
            <div class="events-empty">
                <div class="events-empty-icon">
                    ⚽
                </div>

                <h3>
                    No Events Found
                </h3>

                <p>
                    No events match your current filters.
                    Try changing your search or filters.
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    id="emptyClearFilters"
                >
                    Clear Filters
                </button>
            </div>
        `;

        const clearButton =
            container.querySelector(
                "#emptyClearFilters"
            );

        if (clearButton) {
            clearButton.addEventListener(
                "click",
                clearFilters
            );
        }
    }

    /* =====================================================
       LOADING STATE
    ===================================================== */

    function showLoading(
        container
    ) {
        container.innerHTML = `
            <div class="events-loading">
                <div class="events-loader"></div>

                <p>
                    Loading SPORTING events...
                </p>
            </div>
        `;
    }

    /* =====================================================
       EVENT NOTICE
    ===================================================== */

    function showEventsNotice(
        container,
        message,
        type
    ) {
        let notice =
            document.querySelector(
                "#eventsNotice"
            );

        if (!notice) {
            notice =
                document.createElement(
                    "div"
                );

            notice.id =
                "eventsNotice";

            const parent =
                container.parentElement;

            if (parent) {
                parent.insertBefore(
                    notice,
                    container
                );
            }
        }

        notice.className =
            `events-notice ${type || ""}`;

        notice.textContent =
            message;
    }

    /* =====================================================
       UPDATE EVENT COUNT
    ===================================================== */

    function updateEventCount(
        count
    ) {
        const elements =
            document.querySelectorAll(
                "#eventCount, " +
                "[data-event-count]"
            );

        elements.forEach(element => {
            element.textContent =
                formatNumber(count);
        });
    }

    /* =====================================================
       LOCATION
    ===================================================== */

    function getEventLocation(
        event
    ) {
        const parts = [
            event.location,
            event.city,
            event.state
        ].filter(Boolean);

        return parts.join(", ");
    }

    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatDate(
        dateValue
    ) {
        if (!dateValue) {
            return "Date to be announced";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(dateValue);
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

    /* =====================================================
       STATUS FORMAT
    ===================================================== */

    function formatStatus(
        status
    ) {
        const map = {
            upcoming: "Upcoming",
            ongoing: "Ongoing",
            completed: "Completed",
            cancelled: "Cancelled"
        };

        return (
            map[status] ||
            "Upcoming"
        );
    }

    function getStatusClass(
        status
    ) {
        return `status-${String(
            status || "upcoming"
        ).toLowerCase()}`;
    }

    /* =====================================================
       NUMBER FORMAT
    ===================================================== */

    function formatNumber(
        value
    ) {
        const number =
            Number(value);

        if (
            Number.isNaN(number)
        ) {
            return "0";
        }

        return new Intl.NumberFormat(
            "en-IN"
        ).format(number);
    }

    /* =====================================================
       TEXT TRUNCATION
    ===================================================== */

    function truncateText(
        text,
        maxLength
    ) {
        if (!text) {
            return "";
        }

        const value =
            String(text);

        if (
            value.length <=
            maxLength
        ) {
            return value;
        }

        return (
            value
                .slice(
                    0,
                    maxLength
                )
                .trim() +
            "..."
        );
    }

    /* =====================================================
       DEFAULT EVENT IMAGES
    ===================================================== */

    function getDefaultEventImage(
        sport
    ) {
        const value =
            String(
                sport || "sports"
            ).toLowerCase();

        const images = {
            marathon:
                "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=80",

            running:
                "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=80",

            cricket:
                "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=80",

            football:
                "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=80",

            basketball:
                "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80",

            cycling:
                "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1000&q=80",

            athletics:
                "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80",

            sports:
                "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80"
        };

        for (const key in images) {
            if (
                value.includes(key)
            ) {
                return images[key];
            }
        }

        return images.sports;
    }

    /* =====================================================
       IMAGE INITIALIZATION
    ===================================================== */

    function initializeEventImages(
        container
    ) {
        const images =
            container.querySelectorAll(
                ".event-image"
            );

        images.forEach(image => {
            image.addEventListener(
                "error",
                () => {
                    image.src =
                        getDefaultEventImage(
                            image.alt
                        );
                },
                {
                    once: true
                }
            );
        });
    }

    /* =====================================================
       DEMO EVENTS
    ===================================================== */

    function getDemoEvents() {
        return [
            normalizeEvent({
                id: "demo-marathon-2026",
                name:
                    "SPORTING City Marathon 2026",
                sport:
                    "Marathon & Running",
                category:
                    "Marathon",
                description:
                    "A professionally organized city marathon designed for runners, fitness enthusiasts and sports communities.",
                date:
                    "2026-10-18",
                time:
                    "6:00 AM",
                location:
                    "City Sports Stadium",
                city:
                    "Varanasi",
                state:
                    "Uttar Pradesh",
                participants:
                    0,
                maxParticipants:
                    5000,
                status:
                    "upcoming",
                registrationOpen:
                    true
            }),

            normalizeEvent({
                id: "demo-cricket-2026",
                name:
                    "SPORTING Corporate Cricket Cup",
                sport:
                    "Cricket",
                category:
                    "Tournament",
                description:
                    "A competitive cricket tournament bringing corporate teams together through sport.",
                date:
                    "2026-11-08",
                time:
                    "8:00 AM",
                location:
                    "Sports Ground",
                city:
                    "Varanasi",
                state:
                    "Uttar Pradesh",
                participants:
                    0,
                maxParticipants:
                    256,
                status:
                    "upcoming",
                registrationOpen:
                    true
            }),

            normalizeEvent({
                id: "demo-football-2026",
                name:
                    "SPORTING Football Championship",
                sport:
                    "Football",
                category:
                    "Championship",
                description:
                    "A professionally managed football championship for competitive teams.",
                date:
                    "2026-12-06",
                time:
                    "9:00 AM",
                location:
                    "District Sports Complex",
                city:
                    "Varanasi",
                state:
                    "Uttar Pradesh",
                participants:
                    0,
                maxParticipants:
                    320,
                status:
                    "upcoming",
                registrationOpen:
                    true
            }),

            normalizeEvent({
                id: "demo-athletics-2026",
                name:
                    "SPORTING Athletics Meet",
                sport:
                    "Athletics",
                category:
                    "Athletics Meet",
                description:
                    "Track and field competitions organized with professional event support.",
                date:
                    "2027-01-17",
                time:
                    "7:00 AM",
                location:
                    "Athletics Stadium",
                city:
                    "Varanasi",
                state:
                    "Uttar Pradesh",
                participants:
                    0,
                maxParticipants:
                    600,
                status:
                    "upcoming",
                registrationOpen:
                    true
            })
        ];
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
            return await response.json();
        }

        const text =
            await response.text();

        return {
            message: text
        };
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

            clearTimeout(
                timeout
            );

            timeout =
                setTimeout(
                    () => {
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
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(
        value
    ) {
        return String(value)
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
       PUBLIC API
    ===================================================== */

    window.SPORTING_EVENTS = {

        load: loadEvents,

        refresh: loadEvents,

        getAll: () =>
            [...allEvents],

        getFiltered: () =>
            [...filteredEvents],

        getById: eventId =>
            allEvents.find(
                event =>
                    String(event.id) ===
                    String(eventId)
            ),

        filter: applyFilters,

        clearFilters: clearFilters,

        openDetails:
            openEventDetails,

        closeDetails:
            closeEventModal,

        endpoint:
            EVENTS_ENDPOINT

    };

})();