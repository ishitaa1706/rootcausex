import { createContext, useContext, useReducer, useCallback, useRef } from 'react'

/**
 * InvestigationFocusStore — centralized AI cognition state.
 *
 * Tracks the full investigation lifecycle so every component can react
 * to what the AI is currently doing — without prop-drilling.
 *
 * Key state:
 *   isActive         — investigation panel is open and running
 *   investigationId  — id of the current investigation
 *   propagationPath  — ordered service ids from the RCA (auth → payment → order)
 *   affectedServices — all services mentioned in the RCA
 *   propagationStep  — animation cursor:
 *                        -1  = stable (all path nodes/edges visible)
 *                         N  = only first N+1 nodes revealed (step-by-step animation)
 *   activeStage      — which AIReasoningStream stage is current (0–7)
 *   confidenceLevel  — final confidence score 0–100
 */

const INITIAL = {
  isActive:         false,
  investigationId:  null,
  propagationPath:  [],
  affectedServices: [],
  propagationStep:  -1,
  activeStage:      -1,
  confidenceLevel:  0,
}

function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...INITIAL, isActive: true, investigationId: action.id, activeStage: 0 }
    case 'STAGE':
      return { ...state, activeStage: action.stage }
    case 'PROPAGATION_STEP':
      return { ...state, propagationStep: action.step }
    case 'RCA_READY':
      return {
        ...state,
        propagationPath:  action.propagationPath  ?? [],
        affectedServices: action.affectedServices ?? [],
        confidenceLevel:  action.confidenceScore  ?? 0,
      }
    case 'CLOSE':
      return INITIAL
    default:
      return state
  }
}

const Ctx = createContext(null)

export function InvestigationFocusProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const timersRef = useRef([])

  /** Call when investigation panel opens. Resets all animation state. */
  const startInvestigation = useCallback((id) => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    dispatch({ type: 'START', id })
  }, [])

  /** Call from AIReasoningStream as each stage becomes active. */
  const setStage = useCallback((stage) => {
    dispatch({ type: 'STAGE', stage })
  }, [])

  /**
   * Call when the RCA response arrives.
   * Automatically kicks off the step-by-step propagation animation:
   *   auth lights up → 480ms → auth→payment edge + payment → 480ms → payment→order edge + order
   * After all steps, settles to -1 (stable — all nodes permanently highlighted).
   */
  const rcaReady = useCallback((rca) => {
    dispatch({
      type: 'RCA_READY',
      propagationPath:  rca.propagationPath  ?? [],
      affectedServices: rca.affectedServices ?? [],
      confidenceScore:  rca.confidenceScore  ?? 0,
    })

    // Clear any previous propagation timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    const path = rca.propagationPath ?? []
    if (path.length === 0) return

    // Kick off step-by-step animation
    dispatch({ type: 'PROPAGATION_STEP', step: 0 })

    path.forEach((_, i) => {
      if (i === 0) return
      const t = setTimeout(() => {
        dispatch({ type: 'PROPAGATION_STEP', step: i })
      }, i * 480)
      timersRef.current.push(t)
    })

    // Settle into stable state after full animation
    const stableT = setTimeout(() => {
      dispatch({ type: 'PROPAGATION_STEP', step: -1 })
    }, path.length * 480 + 600)
    timersRef.current.push(stableT)
  }, [])

  /** Call when investigation panel closes. */
  const closeInvestigation = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    dispatch({ type: 'CLOSE' })
  }, [])

  return (
    <Ctx.Provider value={{ state, startInvestigation, setStage, rcaReady, closeInvestigation }}>
      {children}
    </Ctx.Provider>
  )
}

export function useInvestigationFocus() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useInvestigationFocus must be used within InvestigationFocusProvider')
  return ctx
}
