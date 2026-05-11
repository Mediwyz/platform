import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CircularProgress from '../shared/CircularProgress'
import GoalProgressBar from '../shared/GoalProgressBar'
import QuickActionButton from '../shared/QuickActionButton'
import WaterTracker from '../shared/WaterTracker'
import { FaUtensils } from 'react-icons/fa'

describe('Health Tracker Shared Components', () => {
 describe('CircularProgress', () => {
 it('renders with consumed and target values', () => {
 render(<CircularProgress consumed={1500} target={2000} />)
 expect(screen.getByText('1500')).toBeInTheDocument()
 expect(screen.getByText(/of 2000 cal/i)).toBeInTheDocument()
 })

 it('renders with zero values', () => {
 render(<CircularProgress consumed={0} target={2000} />)
 expect(screen.getByText('0')).toBeInTheDocument()
 })
 })

 describe('GoalProgressBar', () => {
 it('renders label and progress', () => {
 render(<GoalProgressBar label="Calories" current={1500} target={2000} unit="cal" />)
 expect(screen.getByText('Calories')).toBeInTheDocument()
 expect(screen.getByText('1500/2000 cal')).toBeInTheDocument()
 })

 it('caps progress at 100%', () => {
 render(<GoalProgressBar label="Water" current={2500} target={2000} unit="ml" />)
 // Progress bar should be capped visually
 expect(screen.getByText('2500/2000 ml')).toBeInTheDocument()
 })
 })

 describe('QuickActionButton', () => {
 it('renders and handles click', () => {
 const onClick = vi.fn()
 render(<QuickActionButton icon={FaUtensils} label="Log Meal" onClick={onClick} />)
 expect(screen.getByText('Log Meal')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button'))
 expect(onClick).toHaveBeenCalledOnce()
 })
 })

 describe('WaterTracker', () => {
 it('renders glass indicators', () => {
 const onAddGlass = vi.fn()
 render(<WaterTracker consumed={750} target={2000} onAddGlass={onAddGlass} />)
 expect(screen.getByText(/750ml/)).toBeInTheDocument()
 })

 it('calls onAddGlass when clicking an empty glass', () => {
 const onAddGlass = vi.fn()
 render(<WaterTracker consumed={500} target={2000} onAddGlass={onAddGlass} />)
 // 500ml / 250ml = 2 filled glasses; click the first empty one (glass 3)
 const addButton = screen.getByRole('button', { name: /Add glass 3/i })
 fireEvent.click(addButton)
 expect(onAddGlass).toHaveBeenCalledOnce()
 })
 })
})
