import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { NumberInput } from './Input/NumberInput/NumperInput';
import { Range } from './Input/Range/Range';
import { Progress } from './Progress/Progress';
import { Start } from './Buttons/Start';
import { Reset } from './Buttons/Reset';
import { Notify } from './Notify/Notify';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: #f4f4f4;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const TimeDisplay = styled.div`
    font-size: 48px;
    margin: 20px 0;
    color: gray;
`;

const RangeContainer = styled.div`
    width: 100%;
    max-width: 500px;
    margin: 20px 0;
`;

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px; // Отступ между кнопками
    margin-top: 20px;
`;

type StateType = 'Active' | 'Unactive' | 'Paused';

export const Countdown: React.FC = () => {
    const [seconds, setSeconds] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [totalTime, setTotalTime] = useState(0); // Время в секундах
    const [remainingTime, setRemainingTime] = useState(0); // Оставшееся время в секундах
    const [isActive, setIsActive] = useState<StateType>('Unactive');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    useEffect(() => {
        const totalInSeconds = minutes * 60 + seconds;
        if (totalInSeconds <= 43200) {
            setTotalTime(totalInSeconds);
            setRemainingTime(totalInSeconds);
        } else {
            setMinutes(720);
            setSeconds(0);
            setTotalTime(43200);
            setRemainingTime(43200);
            setSnackbarMessage('Максимум 720 минут!');
            setSnackbarOpen(true);
        }
    }, [minutes, seconds]);

    useEffect(() => {
        if (isActive === 'Active' && remainingTime > 0) {
            intervalRef.current = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        playSound();
                        handleReset();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (isActive === 'Paused' || remainingTime === 0) {
            clearInterval(intervalRef.current!);
        }

        return () => clearInterval(intervalRef.current!);
    }, [isActive, remainingTime]);

    const handleStart = () => {
        if (totalTime > 0) {
            if (isActive === 'Unactive' || isActive === 'Paused') {
                setRemainingTime(prev => prev);
                setIsActive('Active');
            } else if (isActive === 'Active') {
                setIsActive('Paused');
            }
        } else {
            setSnackbarMessage('Введите время для таймера!');
            setSnackbarOpen(true);
        }
    };

    const handleReset = () => {
        setIsActive('Unactive');
        setMinutes(0);
        setSeconds(0);
        setRemainingTime(0);
    };

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(error => {
                console.error('Audio playback prevented:', error);
            });
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = totalTime > 0 ? ((totalTime - remainingTime) / totalTime) * 100 : 0;

    return (
        <div>
            <Container>
                <NumberInput
                    type='number'
                    placeholder='Введите минуты'
                    value={minutes === 0 ? '' : minutes}
                    min={0}
                    max={720}
                    onChange={newValue => {
                        if (newValue < 0 || newValue > 720) {
                            setSnackbarMessage('Максимум 720 минут!');
                            setSnackbarOpen(true);
                            return;
                        }
                        setMinutes(newValue);
                    }}
                />
                <NumberInput
                    type='number'
                    placeholder='Введите секунды'
                    value={seconds === 0 ? '' : seconds}
                    min={0}
                    max={59}
                    onChange={newValue => {
                        if (newValue < 0 || newValue > 59) {
                            setSnackbarMessage('Максимум 59 секунд!');
                            setSnackbarOpen(true);
                            return;
                        }
                        setSeconds(newValue);
                    }}
                />
                <RangeContainer>
                    <Range
                        type='range'
                        value={totalTime}
                        min={0}
                        max={43200} // Максимум 720 минут в секундах
                        step={15}
                        onChange={value => {
                            setMinutes(Math.floor(value / 60));
                            setSeconds(value % 60);
                        }}
                    />
                </RangeContainer>
                <Progress value={progress} />
                <TimeDisplay>{formatTime(remainingTime)}</TimeDisplay>
                <ButtonContainer>
                    <Start onClick={handleStart} content={isActive === 'Active' ? 'Pause' : 'Start'} />
                    <Reset onClick={handleReset} />
                </ButtonContainer>
                <audio ref={audioRef} src='/countdown.mp3'>
                    <track kind='captions'></track>
                </audio>
                <Notify open={snackbarOpen} onClose={handleSnackbarClose} message={snackbarMessage} />
            </Container>
        </div>
    );
};
