import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 60;
const TIME_WIDTH = 50;
const HEADER_HEIGHT = 50;

const DayView = ({ 
  date, 
  events, 
  onBack,
  config = {} 
}) => {
  const [currentDate, setCurrentDate] = useState(date);

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      
      const eventStart = new Date(event.startDate);
      eventStart.setHours(0, 0, 0, 0);
      
      const eventEnd = new Date(event.endDate);
      eventEnd.setHours(23, 59, 59, 999);

      return compareDate >= eventStart && compareDate <= eventEnd;
    });
  };

  const getSeriesEvents = (date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const compareDate = new Date(date);
      
      // Check if it's a multi-day event
      const isMultiDay = eventEnd.getDate() - eventStart.getDate() > 0;
      
      // Check if the date falls within the event period
      const isWithinPeriod = compareDate >= eventStart && compareDate <= eventEnd;
      
      return isMultiDay && isWithinPeriod;
    });
  };

  const getDayData = () => {
    const days = [];
    for (let i = -1; i <= 1; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      days.push({ id: i.toString(), date });
    }
    return days;
  };

  const renderTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(
        <View key={i} style={styles.timeSlot}>
          <Text style={styles.timeText}>
            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
          </Text>
        </View>
      );
    }
    return slots;
  };

  const calculateEventPosition = (event, allDayEvents) => {
    // Find events that overlap with current event
    const overlappingEvents = allDayEvents.filter(otherEvent => {
      if (otherEvent.id === event.id) return false;
      
      const eventStart = event.startDate.getTime();
      const eventEnd = event.endDate.getTime();
      const otherStart = otherEvent.startDate.getTime();
      const otherEnd = otherEvent.endDate.getTime();

      return (eventStart < otherEnd && eventEnd > otherStart);
    });

    // Calculate column position and total columns needed
    let column = 0;
    while (overlappingEvents.some(e => e._column === column)) {
      column++;
    }
    
    const totalColumns = Math.max(
      column + 1,
      ...overlappingEvents.map(e => e._column + 1)
    );

    return { column, totalColumns };
  };

  const renderEvent = (event, top, height, left, width) => {
    return (
      <View
        key={event.id}
        style={[
          styles.event,
          {
            top,
            height,
            backgroundColor: event.color,
            left: `${left}%`,
            width: `${width}%`,
          }
        ]}
      >
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventTime}>{formatEventTime(event)}</Text>
      </View>
    );
  };

  const renderSeriesEvents = (date) => {
    const seriesEvents = getSeriesEvents(date);
    return seriesEvents.map((event, index) => (
      <View
        key={event.id}
        style={[
          styles.seriesEvent,
          {
            backgroundColor: event.color,
            top: index * 22 + 4, // Stack series events vertically
          }
        ]}
      >
        <Text style={styles.seriesEventText} numberOfLines={1}>
          {event.title}
        </Text>
      </View>
    ));
  };

  const renderDayEvents = (date) => {
    const dayEvents = getEventsForDate(date);
    
    // Sort events by start time
    const sortedEvents = dayEvents.sort((a, b) => 
      a.startDate.getTime() - b.startDate.getTime()
    );

    // Calculate positions for overlapping events
    sortedEvents.forEach(event => {
      const { column, totalColumns } = calculateEventPosition(event, sortedEvents);
      event._column = column;
      event._totalColumns = totalColumns;
    });

    return sortedEvents.map(event => {
      const startHour = event.startDate.getHours();
      const startMinute = event.startDate.getMinutes();
      const endHour = event.endDate.getHours();
      const endMinute = event.endDate.getMinutes();
      
      const top = (startHour + startMinute/60) * HOUR_HEIGHT;
      const height = (endHour - startHour + (endMinute - startMinute)/60) * HOUR_HEIGHT;
      
      // Calculate width and left position for overlapping events
      const columnWidth = 100 / event._totalColumns;
      const left = columnWidth * event._column;
      const width = columnWidth;

      return renderEvent(event, top, height, left, width);
    });
  };

  const renderDay = ({ item }) => {
    return (
      <View style={styles.dayContainer}>
        <View style={styles.stickyHeader}>
          <TouchableOpacity 
            style={styles.dayNumberContainer}
            onPress={onBack}
          >
            <Text style={styles.dayNumber}>{item.date.getDate()}</Text>
          </TouchableOpacity>
          <View style={styles.seriesEventsContainer}>
            {renderSeriesEvents(item.date)}
          </View>
        </View>
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.content}>
            <View style={styles.timeline}>
              {renderTimeSlots()}
            </View>
            <View style={styles.eventsContainer}>
              <View style={styles.hourLines}>
                {Array(24).fill(0).map((_, i) => (
                  <View key={i} style={styles.hourLine} />
                ))}
              </View>
              {renderDayEvents(item.date)}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const onScrollEndDrag = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const draggedIndex = Math.round(xOffset / SCREEN_WIDTH);
    
    if (draggedIndex !== 1) {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + (draggedIndex - 1));
      setCurrentDate(newDate);
    }
  };

  const formatEventTime = (event) => {
    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const isAllDay = 
      event.startDate.getHours() === 0 && 
      event.startDate.getMinutes() === 0 && 
      event.endDate.getHours() === 23 && 
      event.endDate.getMinutes() === 59;

    if (isAllDay) {
      return 'All day';
    }

    return `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`;
  };

  return (
    <FlatList
      data={getDayData()}
      renderItem={renderDay}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={1}
      getItemLayout={(data, index) => ({
        length: SCREEN_WIDTH,
        offset: SCREEN_WIDTH * index,
        index,
      })}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onScrollEndDrag}
      scrollEventThrottle={16}
      decelerationRate="fast"
      snapToInterval={SCREEN_WIDTH}
      snapToAlignment="start"
    />
  );
};

const styles = StyleSheet.create({
  dayContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    height: HOUR_HEIGHT * 24, // Total height for all hours
  },
  timeline: {
    width: TIME_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  eventsContainer: {
    flex: 1,
    position: 'relative',
  },
  hourLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  hourLine: {
    height: HOUR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  event: {
    position: 'absolute',
    borderRadius: 4,
    padding: 4,
    overflow: 'hidden',
    zIndex: 2,
  },
  eventTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  eventTime: {
    color: '#FFF',
    fontSize: 10,
    opacity: 0.8,
  },
  stickyHeader: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  dayNumberContainer: {
    width: TIME_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    padding: 8,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seriesEventsContainer: {
    flex: 1,
    position: 'relative',
    paddingVertical: 2,
  },
  seriesEvent: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  seriesEventText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default DayView; 