import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import DayView from './DayView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_PADDING = 8;
const DAY_CELL_COUNT = 7;
const DAY_CELL_WIDTH = Math.floor((SCREEN_WIDTH - (CALENDAR_PADDING * 2)) / DAY_CELL_COUNT);

// Add configuration options at the top
const DEFAULT_CONFIG = {
  showPreviousMonthDays: true,
  showEventsOnPreviousMonthDays: true,
  maxEventsPerDay: 3,
  eventHeight: 16,
  eventSpacing: 18,
};

// Add TypeScript-like prop types at the top
const CalendarModes = {
  MONTH: 'month',
  DAY: 'day'
};

// Add these utility functions back at the top of the file, before the Calendar component
const sortEvents = (events) => {
  return events.sort((a, b) => {
    // First sort by event duration (multi-day events first)
    const aDuration = a.endDate - a.startDate;
    const bDuration = b.endDate - b.startDate;
    
    if (aDuration !== bDuration) {
      return bDuration - aDuration; // Longer duration events come first
    }
    
    // If same duration, sort by start date
    return a.startDate - b.startDate;
  });
};

const formatEventTime = (event) => {
  const isAllDay = 
    event.startDate.getHours() === 0 && 
    event.startDate.getMinutes() === 0 && 
    event.endDate.getHours() === 23 && 
    event.endDate.getMinutes() === 59;

  if (isAllDay) {
    return 'All day';
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (event.startDate.toDateString() === event.endDate.toDateString()) {
    // Same day event
    return `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`;
  } else {
    // Multi-day event
    return `${formatTime(event.startDate)} →`;
  }
};

const Calendar = ({ 
  mode = CalendarModes.MONTH,
  selectedDate = new Date(),
  dateRange = {
    start: new Date(2024, 0, 1),
    end: new Date(2025, 11, 31)
  },
  events = [],
  config = {},
  onModeChange = () => {}
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [viewMode, setViewMode] = useState(mode);
  const [selectedDay, setSelectedDay] = useState(null);
  const flatListRef = useRef(null);

  // Add useEffect to handle mode and date changes from props
  useEffect(() => {
    setViewMode(mode);
  }, [mode]);

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  // Update useEffect to notify parent about mode changes
  useEffect(() => {
    onModeChange(viewMode);
  }, [viewMode]);

  // Validate if date is within range
  const isDateInRange = (date) => {
    return date >= dateRange.start && date <= dateRange.end;
  };

  // Merge default config with provided config
  const calendarConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  // Update getMonthsData to respect date range
  const getMonthsData = () => {
    const months = [];
    for (let i = -1; i <= 1; i++) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() + i);
      
      // Skip if date is outside range
      if (!isDateInRange(date)) continue;
      
      months.push({
        id: i.toString(),
        date: date
      });
    }
    return months;
  };

  // Update the getEventsForDate function
  const getEventsForDate = (date) => {
    return events.filter(event => {
      // Set the date to start of the day for comparison
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      
      const eventStart = new Date(event.startDate);
      eventStart.setHours(0, 0, 0, 0);
      
      const eventEnd = new Date(event.endDate);
      eventEnd.setHours(23, 59, 59, 999);

      return compareDate >= eventStart && compareDate <= eventEnd;
    });
  };

  // Update the isEventStart and isEventEnd functions
  const isEventStart = (date, event) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const eventStart = new Date(event.startDate);
    eventStart.setHours(0, 0, 0, 0);
    
    return compareDate.getTime() === eventStart.getTime();
  };

  const isEventEnd = (date, event) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const eventEnd = new Date(event.endDate);
    eventEnd.setHours(0, 0, 0, 0);
    
    return compareDate.getTime() === eventEnd.getTime();
  };

  const renderEvent = (event, date, isFirst, isLast, position) => {
    const eventStyle = {
      backgroundColor: event.color,
      opacity: 0.9,
      height: calendarConfig.eventHeight,
      marginVertical: 1,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      left: 0,
      right: 0,
      top: position * calendarConfig.eventSpacing,
      marginLeft: isFirst ? 2 : -1,
      marginRight: isLast ? 2 : -1,
      zIndex: 10 - position,
    };

    if (isFirst) {
      eventStyle.borderTopLeftRadius = 10;
      eventStyle.borderBottomLeftRadius = 10;
    }
    if (isLast) {
      eventStyle.borderTopRightRadius = 10;
      eventStyle.borderBottomRightRadius = 10;
    }

    // Calculate how many days this event spans
    const eventLength = Math.ceil((event.endDate - event.startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return (
      <View key={`${event.id}-${date}`} style={eventStyle}>
        {isFirst && (
          <View style={styles.eventContent}>
            <Text numberOfLines={1} style={[
              styles.eventText,
              isFirst && { width: eventLength * (DAY_CELL_WIDTH - 2) }
            ]}>
              {event.title}
            </Text>
            <Text numberOfLines={1} style={styles.eventTime}>
              {formatEventTime(event)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add days from previous month if configured
    if (startingDay > 0 && calendarConfig.showPreviousMonthDays) {
      const prevMonth = new Date(year, month - 1, 1);
      const prevMonthLastDay = new Date(year, month, 0);
      const prevMonthDays = prevMonthLastDay.getDate();
      
      for (let i = startingDay - 1; i >= 0; i--) {
        const dayNumber = prevMonthDays - i;
        days.push({ 
          day: dayNumber,
          empty: false,
          isOtherMonth: true,
          date: new Date(year, month - 1, dayNumber)
        });
      }
    } else if (startingDay > 0) {
      // Add empty spaces if not showing previous month days
      for (let i = 0; i < startingDay; i++) {
        days.push({ day: '', empty: true });
      }
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i,
        empty: false,
        isOtherMonth: false,
        date: new Date(year, month, i)
      });
    }

    // Filter out days outside the date range
    return days.filter(day => {
      if (day.empty) return true;
      return isDateInRange(day.date);
    });
  };

  const renderDayContent = (day, date) => {
    if (day.empty) return null;

    // Only show events if configured for other month days
    const shouldShowEvents = !day.isOtherMonth || calendarConfig.showEventsOnPreviousMonthDays;
    const dayEvents = shouldShowEvents ? getEventsForDate(date) : [];
    const sortedEvents = sortEvents(dayEvents);
    
    // Track positions for multi-day events
    const multiDayPositions = new Map();
    let nextPosition = 0;

    // First pass: assign positions to multi-day events
    sortedEvents.forEach(event => {
      const isMultiDay = event.startDate.toDateString() !== event.endDate.toDateString();
      if (isMultiDay) {
        multiDayPositions.set(event.id, nextPosition);
        nextPosition++;
      }
    });

    return (
      <TouchableOpacity 
        style={styles.dayContent}
        onPress={() => handleDayPress(date)}
      >
        <Text style={[
          styles.dayText,
          day.isOtherMonth && styles.otherMonthDayText
        ]}>
          {day.day}
        </Text>
        {shouldShowEvents && (
          <View style={styles.eventsContainer}>
            {sortedEvents.slice(0, calendarConfig.maxEventsPerDay).map((event) => {
              const isFirst = isEventStart(date, event);
              const isLast = isEventEnd(date, event);
              const isMultiDay = event.startDate.toDateString() !== event.endDate.toDateString();
              
              let position;
              if (isMultiDay) {
                position = multiDayPositions.get(event.id);
              } else {
                position = nextPosition++;
              }

              return renderEvent(event, date, isFirst, isLast, position);
            })}
            {sortedEvents.length > calendarConfig.maxEventsPerDay && (
              <Text style={[
                styles.moreEvents, 
                { top: nextPosition * calendarConfig.eventSpacing }
              ]}>
                +{sortedEvents.length - calendarConfig.maxEventsPerDay}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMonth = ({ item }) => {
    const days = getDaysInMonth(item.date);
    const monthName = item.date.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <View style={styles.monthContainer}>
        <Text style={styles.monthHeader}>{monthName}</Text>
        <View style={styles.calendarGrid}>
          <View style={styles.weekDaysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysContainer}>
            {days.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.dayCell,
                  day.empty && styles.emptyDay
                ]}
              >
                {day.empty ? (
                  <Text style={[styles.dayText, styles.emptyDayText]}>{day.day}</Text>
                ) : (
                  renderDayContent(day, day.date)
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const handleMonthChange = (newDate) => {
    setCurrentDate(newDate);
    // Reset to middle index
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({ 
        index: 1, 
        animated: false,
        viewPosition: 0
      });
    });
  };

  const onScrollBeginDrag = () => {
    // Save the current index when drag begins
    const currentX = flatListRef.current?.scrollToOffset?.x || SCREEN_WIDTH;
    setCurrentIndex(Math.round(currentX / SCREEN_WIDTH));
  };

  const onScrollEndDrag = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const draggedIndex = Math.round(xOffset / SCREEN_WIDTH);
    
    if (draggedIndex !== 1) { // Only handle if we've moved from center
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + (draggedIndex - 1));
      handleMonthChange(newDate);
    }
  };

  const onMomentumScrollEnd = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(xOffset / SCREEN_WIDTH);
    
    if (pageIndex !== 1) { // Only handle if we've moved from center
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + (pageIndex - 1));
      handleMonthChange(newDate);
    }
  };

  const handleDayPress = (date) => {
    if (viewMode === CalendarModes.MONTH) {
      setViewMode(CalendarModes.DAY);
      setCurrentDate(date);
      setSelectedDay(date);
    }
  };

  const handleBack = () => {
    setViewMode(CalendarModes.MONTH);
    setSelectedDay(null);
  };

  // Render based on mode
  if (viewMode === CalendarModes.DAY) {
    return (
      <DayView
        date={currentDate}
        events={events}
        onBack={handleBack}
        config={config}
      />
    );
  }

  // Month view render
  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={true}
    >
      <FlatList
        ref={flatListRef}
        data={getMonthsData()}
        renderItem={renderMonth}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={1}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
      />
    </ScrollView>
  );
};

// Export constants for external use
export const CALENDAR_MODES = CalendarModes;

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  monthContainer: {
    width: SCREEN_WIDTH,
    padding: CALENDAR_PADDING,
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarGrid: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  weekDayCell: {
    width: DAY_CELL_WIDTH,
    paddingVertical: 8,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: 1,
  },
  dayCell: {
    width: DAY_CELL_WIDTH,
    height: DAY_CELL_WIDTH * 2,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  emptyDay: {
    backgroundColor: '#F8F8F8',
  },
  emptyDayText: {
    color: 'transparent',
  },
  dayContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 2,
    position: 'relative',
    zIndex: 1,
  },
  eventsContainer: {
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  eventContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    overflow: 'hidden',
  },
  eventText: {
    fontSize: 7,
    color: '#FFF',
    fontWeight: '500',
    position: 'absolute',
    left: 4,
    right: 4,
    top: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  eventTime: {
    fontSize: 6,
    color: '#FFF',
    opacity: 0.9,
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  moreEvents: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  otherMonthDayText: {
    color: '#BBBBBB',  // lighter color for other month days
  },
});

export default Calendar; 