// Utility functions for time calculations

export interface VendorOperatingInfo {
    openingTime?: string | null;
    closingTime?: string | null;
    operatingDays?: string[];
}

/**
 * Parse time string (e.g., "09:00", "21:30") to hours and minutes
 */
function parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
}

/**
 * Format time for display (e.g., "9:00 AM", "9:30 PM")
 */
function formatTime(hours: number, minutes: number): string {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
    return `${displayHours}${displayMinutes} ${period}`;
}

/**
 * Get the next occurrence of a specific day
 */
function getNextDayOfWeek(dayName: string): Date {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.indexOf(dayName.toLowerCase());
    
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
    
    // If it's 0 (same day), check if we need next week's occurrence
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    
    return targetDate;
}

/**
 * Normalize day name to lowercase for consistent comparison
 */
function normalizeDayName(dayName: string): string {
    return dayName.toLowerCase().trim();
}

/**
 * Check if a vendor is currently open based on operating hours
 */
export function isVendorCurrentlyOpen(vendor: VendorOperatingInfo): boolean {
    if (!vendor.openingTime || !vendor.closingTime || !vendor.operatingDays?.length) {
        return false;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    
    // Normalize current day and operating days for comparison
    const normalizedCurrentDay = normalizeDayName(currentDay);
    const normalizedOperatingDays = vendor.operatingDays.map(day => normalizeDayName(day));
    
    // Check if today is an operating day
    if (!normalizedOperatingDays.includes(normalizedCurrentDay)) {
        return false;
    }

    // Parse opening and closing times
    const { hours: openHours, minutes: openMinutes } = parseTime(vendor.openingTime);
    const { hours: closeHours, minutes: closeMinutes } = parseTime(vendor.closingTime);
    
    const openingMinutes = openHours * 60 + openMinutes;
    const closingMinutes = closeHours * 60 + closeMinutes;
    
    // Handle overnight hours (e.g., 10 PM to 2 AM)
    if (closingMinutes < openingMinutes) {
        return currentTime >= openingMinutes || currentTime < closingMinutes;
    }
    
    return currentTime >= openingMinutes && currentTime < closingMinutes;
}

/**
 * Get the next opening time for a closed vendor
 */
export function getNextOpeningTime(vendor: VendorOperatingInfo): string {
    if (!vendor.openingTime || !vendor.operatingDays?.length) {
        return "Hours not available";
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Parse opening time
    const { hours: openHours, minutes: openMinutes } = parseTime(vendor.openingTime);
    const openingMinutes = openHours * 60 + openMinutes;
    
    // Normalize days for comparison
    const normalizedCurrentDay = normalizeDayName(currentDay);
    const normalizedOperatingDays = vendor.operatingDays.map(day => normalizeDayName(day));
    
    // Check if vendor opens later today
    const isOperatingToday = normalizedOperatingDays.includes(normalizedCurrentDay);
    
    if (isOperatingToday && currentTime < openingMinutes) {
        return `Opens today at ${formatTime(openHours, openMinutes)}`;
    }
    
    // Find next operating day
    const sortedDays = vendor.operatingDays
        .map(day => ({ name: day, date: getNextDayOfWeek(day) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const nextOperatingDay = sortedDays[0];
    const dayName = nextOperatingDay.name;
    const dayDate = nextOperatingDay.date;
    
    // Check if it's tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dayDate.toDateString() === tomorrow.toDateString()) {
        return `Opens tomorrow at ${formatTime(openHours, openMinutes)}`;
    }
    
    // Check if it's next week (same day)
    if (dayDate.getDay() === now.getDay() && dayDate.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
        return `Opens next ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} at ${formatTime(openHours, openMinutes)}`;
    }
    
    // Otherwise, show the day name
    return `Opens on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} at ${formatTime(openHours, openMinutes)}`;
}

/**
 * Get closing time information for a vendor
 */
export function getClosingTime(vendor: VendorOperatingInfo): string {
    if (!vendor.closingTime || !vendor.operatingDays?.length) {
        return "Hours not available";
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Parse closing time
    const { hours: closeHours, minutes: closeMinutes } = parseTime(vendor.closingTime);
    const closingMinutes = closeHours * 60 + closeMinutes;
    
    // Normalize days for comparison
    const normalizedCurrentDay = normalizeDayName(currentDay);
    const normalizedOperatingDays = vendor.operatingDays.map(day => normalizeDayName(day));
    
    // Check if vendor is operating today
    const isOperatingToday = normalizedOperatingDays.includes(normalizedCurrentDay);
    
    if (!isOperatingToday) {
        return "Not operating today";
    }
    
    // Check if vendor closes today (handle overnight hours)
    const { hours: openHours, minutes: openMinutes } = parseTime(vendor.openingTime || "00:00");
    const openingMinutes = openHours * 60 + openMinutes;
    
    // If closing time is before opening time (overnight), vendor closes tomorrow
    if (closingMinutes < openingMinutes) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (currentTime < closingMinutes) {
            // Still open from yesterday, closes today
            return `Closes at ${formatTime(closeHours, closeMinutes)}`;
        } else {
            // Opens today, closes tomorrow
            return `Closes tomorrow at ${formatTime(closeHours, closeMinutes)}`;
        }
    }
    
    // Normal hours (same day open/close)
    if (currentTime < closingMinutes) {
        return `Closes at ${formatTime(closeHours, closeMinutes)}`;
    } else {
        return `Closed for today`;
    }
}

/**
 * Get current operating status and time info
 */
export function getVendorTimeInfo(vendor: VendorOperatingInfo): { status: string; timeInfo: string } {
    if (!vendor.openingTime || !vendor.closingTime || !vendor.operatingDays?.length) {
        return { status: "Hours not available", timeInfo: "" };
    }

    const isOpen = isVendorCurrentlyOpen(vendor);
    
    if (isOpen) {
        return {
            status: "Open",
            timeInfo: getClosingTime(vendor)
        };
    } else {
        return {
            status: "Closed", 
            timeInfo: getNextOpeningTime(vendor)
        };
    }
}

