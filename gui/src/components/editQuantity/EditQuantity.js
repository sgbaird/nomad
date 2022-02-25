/*
 * Copyright The NOMAD Authors.
 *
 * This file is part of NOMAD. See https://nomad-lab.eu for further info.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  TextField,
  makeStyles,
  Box,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  MenuItem,
  Dialog,
  DialogContent,
  FormControl,
  FormLabel, RadioGroup, Radio, Slider
} from '@material-ui/core'
import PropTypes from 'prop-types'
import {convertUnit, Unit, useUnits} from '../../units'
import {conversionMap, unitMap} from '../../unitsData'
import AutoComplete from '@material-ui/lab/Autocomplete'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import Markdown from '../Markdown'
import {dateFormat} from '../../config'
import {KeyboardDatePicker, KeyboardTimePicker} from '@material-ui/pickers'
import {getTime} from 'date-fns'
import AccessTimeIcon from '@material-ui/icons/AccessTime'
import {Datatable, DatatableTable} from '../datatable/Datatable'

const HelpDialog = React.memo(({title, description}) => {
  const [open, setOpen] = useState(false)

  return <React.Fragment>
    {description && <IconButton size="small" onClick={() => setOpen(true)}>
      {<HelpOutlineIcon fontSize='small'/>}
    </IconButton>}
    {open && <Dialog open={open}>
      <DialogContent>
        <Markdown>{`
        ### ${title}
        ${description}
      `}</Markdown>
      </DialogContent>
      <DialogActions>
        <span style={{flexGrow: 1}} />
        <Button onClick={() => setOpen(false)} color="secondary">
          Close
        </Button>
      </DialogActions>

    </Dialog>}
  </React.Fragment>
})
HelpDialog.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string
}

const useHelpAdornmentStyles = makeStyles(theme => ({
  root: {},
  withOtherAdornment: {
    marginRight: theme.spacing(3)
  }
}))

const HelpAdornment = React.memo(({title, description, withOtherAdornment}) => {
  const classes = useHelpAdornmentStyles()
  return <InputAdornment
    position="end"
    className={withOtherAdornment ? classes.withOtherAdornment : classes.root}
  >
    <HelpDialog title={title} description={description}/>
  </InputAdornment>
})
HelpAdornment.propTypes = {
  withOtherAdornment: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string
}

const useWithHelpStyles = makeStyles(theme => ({
  root: {
    '&:not(:hover)': {
      '& #help': {
        display: 'none'
      }
    }
  }
}))

const TextFieldWithHelp = React.memo((props) => {
  const {withOtherAdornment, helpTitle, helpDescription, ...otherProps} = props
  const classes = useWithHelpStyles()
  return <TextField
    className={classes.root}
    InputProps={{endAdornment: (
      <div id="help">
        <HelpAdornment title={helpTitle} description={helpDescription} withOtherAdornment={withOtherAdornment}/>
      </div>
    )}}
    {...otherProps}
  />
})
TextFieldWithHelp.propTypes = {
  withOtherAdornment: PropTypes.bool,
  helpTitle: PropTypes.string,
  helpDescription: PropTypes.string
}

const WithHelp = React.memo((props) => {
  const {helpTitle, helpDescription, ...otherProps} = props
  const classes = useWithHelpStyles()
  if (!helpDescription) {
    return ''
  }
  return <Box display="flex" alignItems="center" className={classes.root}>
    <Box flexGrow={1} {...otherProps}/>
    <Box>
      <div id="help">
        <HelpDialog title={helpTitle} description={helpDescription} />
      </div>
    </Box>
  </Box>
})
WithHelp.propTypes = {
  helpTitle: PropTypes.string,
  helpDescription: PropTypes.string
}

export const StringEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState()

  useEffect(() => {
    setValue(section[quantityDef.name])
  }, [quantityDef, section])

  const handleChange = useCallback((newValue) => {
    setValue(newValue || '')
    if (onChange) {
      onChange(newValue, section, quantityDef)
    }
  }, [onChange, quantityDef, section])

  return <TextFieldWithHelp
    fullWidth variant='filled' size='small'
    label={label}
    value={value || ''}
    placeholder={quantityDef.description}
    onChange={event => handleChange(event.target.value)} {...otherProps}
    helpTitle={label} helpDescription={quantityDef.description}
  />
})
StringEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

const useNumberEditQuantityStyles = makeStyles(theme => ({
  unitSelect: {
    marginLeft: theme.spacing(1),
    width: '150px'
  }
}))

export const NumberEditQuantity = React.memo((props) => {
  const classes = useNumberEditQuantityStyles()
  const {quantityDef, section, onChange, minValue, maxValue, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState()
  const [convertedValue, setConvertedValue] = useState()
  const [error, setError] = useState('')
  const systemUnits = useUnits()
  const defaultValue = (quantityDef.default !== undefined ? quantityDef.default : '')
  const dimension = quantityDef.unit && unitMap[quantityDef.unit].dimension
  const units = quantityDef.unit && conversionMap[dimension].units
  const isUnit = quantityDef.unit && ['float64', 'float32', 'float'].includes(quantityDef.type?.type_data)
  const [unit, setUnit] = useState(systemUnits[dimension] || quantityDef.unit)
  const timeout = useRef()

  useEffect(() => {
    let newValue = section[quantityDef.name] || defaultValue
    setValue(newValue)
    setConvertedValue(`${(isUnit ? (!isNaN(Number(newValue)) || newValue === '' ? convertUnit(Number(newValue), quantityDef.unit, unit) : '') : newValue)}`)
  }, [defaultValue, isUnit, quantityDef, section, unit])

  const handleChangeUnit = useCallback((newUnit) => {
    setUnit(newUnit)
    setConvertedValue(`${(isUnit ? (!isNaN(Number(value)) || value === '' ? convertUnit(Number(value), quantityDef.unit, newUnit) : '') : value)}`)
  }, [isUnit, quantityDef, value])

  const isValidNumber = useCallback((value) => {
    if (['int64', 'int32', 'int'].includes(quantityDef.type?.type_data)) {
      const num = Number(value)
      return Number.isInteger(num)
    } else if (['uint64', 'uint32', 'uint'].includes(quantityDef.type?.type_data)) {
      const num = Number(value)
      return Number.isInteger(num) && num > 0
    } else if (['float64', 'float32', 'float'].includes(quantityDef.type?.type_data)) {
      const num = Number(value)
      return !isNaN(num)
    }
  }, [quantityDef])

  const validation = useCallback((newValue) => {
    setError('')
    if (newValue === '') {
      setConvertedValue('')
      setValue('')
    } else if (!isValidNumber(newValue)) {
      setError('Please enter a valid number!')
    } else {
      let originalValue = (isUnit ? convertUnit(Number(newValue), unit, quantityDef.unit) : newValue)
      if (minValue !== undefined && originalValue < minValue) {
        setError(`The value should be higher than or equal to ${minValue}${(isUnit ? `${(new Unit(quantityDef.unit)).label()}` : '')}`)
      } else if (maxValue !== undefined && originalValue > maxValue) {
        setError(`The value should be less than or equal to ${maxValue}${(isUnit ? `${(new Unit(quantityDef.unit)).label()}` : '')}`)
      } else {
        setValue(originalValue)
        setConvertedValue(`${Number(newValue)}`)
      }
    }
  }, [isUnit, isValidNumber, maxValue, minValue, quantityDef, unit])

  const handleChangeValue = useCallback((newValue) => {
    setConvertedValue(`${newValue}`)
    if (onChange) {
      onChange((isUnit ? (newValue === '' ? newValue : (!isNaN(Number(newValue)) ? convertUnit(Number(newValue), unit, quantityDef.unit) : '')) : newValue), section, quantityDef)
    }
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      validation(newValue)
    }, 1000)
  }, [isUnit, validation, unit, onChange, quantityDef, section, timeout])

  const handleValidator = useCallback((event) => {
    validation(event.target.value)
  }, [validation])

  return <Box display='flex'>
    <TextFieldWithHelp
      fullWidth variant='filled' size='small'
      label={label}
      value={convertedValue || ''}
      onBlur={handleValidator} error={!!error} helperText={error}
      placeholder={quantityDef.description}
      onChange={event => handleChangeValue(event.target.value)}
      helpTitle={label} helpDescription={quantityDef.description}
      {...otherProps}
    />
    {isUnit && <TextField
      className={classes.unitSelect} variant='filled' size='small' select
      label="unit" value={unit}
      onChange={(event) => handleChangeUnit(event.target.value)}
    >
      {units.map(unit => <MenuItem key={unit} value={unit}>{(new Unit(unit)).label()}</MenuItem>)}
    </TextField>}
  </Box>
})
NumberEditQuantity.propTypes = {
  maxValue: PropTypes.number,
  minValue: PropTypes.number,
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const EnumEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState(section[quantityDef.name] || quantityDef.default || '')

  const handleChange = useCallback((value) => {
    setValue(value)
    if (onChange) {
      onChange(value === '' ? undefined : value, section, quantityDef)
    }
  }, [onChange, quantityDef, section])

  return <TextFieldWithHelp
    select variant='filled' size='small' withOtherAdornment fullWidth
    label={label} {...otherProps} value={value}
    onChange={event => handleChange(event.target.value)}
    helpTitle={label} helpDescription={quantityDef.description}
  >
    {quantityDef.type?.type_data.map(item => <MenuItem value={item} key={item}>{item}</MenuItem>)}
  </TextFieldWithHelp>
})
EnumEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const AutocompleteEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState(section[quantityDef.name] || quantityDef.default || null)

  const handleChange = useCallback((value) => {
    setValue(value)
    if (onChange) {
      onChange((value === '' ? undefined : value), section, quantityDef)
    }
  }, [onChange, quantityDef, section, setValue])

  return <AutoComplete
    options={quantityDef.type.type_data}
    onChange={(event, value) => handleChange(value)}
    ListboxProps={{style: {maxHeight: '150px'}}}
    value={value}
    renderInput={params => (
      <TextFieldWithHelp
        {...params}
        variant='filled' size='small' label={label}
        helpTitle={label} helpDescription={quantityDef.description}
        placeholder={quantityDef.description} fullWidth/>
    )}
    {...otherProps}
  />
})
AutocompleteEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const RadioButtonEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState(section[quantityDef.name] || quantityDef.default || '')

  const handleChange = useCallback((value) => {
    setValue(value)
    if (onChange) {
      onChange(value === '' ? undefined : value, section, quantityDef)
    }
  }, [onChange, quantityDef, section])

  return <FormControl>
    <FormLabel>{label}</FormLabel>
    <RadioGroup row>
      {quantityDef.type?.type_data.map(item => <FormControlLabel value={item} key={item} control={<Radio checked={value === item} onClick={event => handleChange(item)} {...otherProps}/>} label={item}/>)}
    </RadioGroup>
  </FormControl>
})
RadioButtonEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const BoolEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState()
  const defaultValue = (quantityDef.default !== undefined ? quantityDef.default : '')

  useEffect(() => {
    setValue(section[quantityDef.name] || defaultValue)
  }, [defaultValue, quantityDef, section])

  const handleChange = useCallback((newValue) => {
    setValue(newValue)
    if (onChange) {
      onChange((newValue === '' ? defaultValue : newValue), section, quantityDef)
    }
  }, [defaultValue, onChange, quantityDef, section])

  return <WithHelp helpTitle={label} helpDescription={quantityDef.description}>
    <FormControlLabel
      label={label}
      control={<Checkbox onChange={event => handleChange(event.target.checked)} color="primary" checked={(!!value)} {...otherProps}/>}
    />
  </WithHelp>
})
BoolEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const SliderEditQuantity = React.memo((props) => {
  const classes = useNumberEditQuantityStyles()
  const {quantityDef, section, onChange, minValue, maxValue, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const defaultValue = (quantityDef.default !== undefined ? quantityDef.default : undefined)
  const [value, setValue] = useState(0)
  const [convertedValue, setConvertedValue] = useState(0)
  const dimension = quantityDef.unit && unitMap[quantityDef.unit].dimension
  const units = quantityDef.unit && conversionMap[dimension].units
  const systemUnits = useUnits()
  const isUnit = quantityDef.unit && ['float64', 'float32', 'float'].includes(quantityDef.type?.type_data)
  const [unit, setUnit] = useState(systemUnits[dimension] || quantityDef.unit)

  useEffect(() => {
    let newValue = section[quantityDef.name] || defaultValue || minValue
    setValue(newValue)
    setConvertedValue(`${(isUnit ? (!isNaN(Number(newValue)) || newValue === '' ? convertUnit(Number(newValue), quantityDef.unit, unit) : '') : newValue)}`)
  }, [defaultValue, isUnit, minValue, quantityDef, section, unit])

  const handleChangeUnit = useCallback((newUnit) => {
    setUnit(newUnit)
    setConvertedValue(`${(isUnit ? (!isNaN(Number(value)) || value === '' ? convertUnit(Number(value), quantityDef.unit, newUnit) : '') : value)}`)
  }, [isUnit, quantityDef, value])

  const handleChangeValue = useCallback((event, newValue) => {
    if (typeof newValue !== 'number') return
    setConvertedValue(`${newValue}`)
    if (onChange) {
      onChange((isUnit ? (newValue === '' ? newValue : (!isNaN(Number(newValue)) ? convertUnit(Number(newValue), unit, quantityDef.unit) : '')) : newValue), section, quantityDef)
    }
    setValue((isUnit ? (!isNaN(Number(newValue)) || newValue === '' ? convertUnit(Number(newValue), unit, quantityDef.unit) : '') : newValue))
    setConvertedValue(`${Number(newValue)}`)
  }, [isUnit, unit, onChange, quantityDef, section])

  return <FormControl fullWidth>
    <FormLabel>{label}</FormLabel>
    <Box display='flex'>
      <Slider
        value={Number(convertedValue)}
        min={convertUnit(Number(minValue), quantityDef.unit, unit)}
        max={convertUnit(Number(maxValue), quantityDef.unit, unit)}
        onChange={handleChangeValue}
        valueLabelDisplay={(!isUnit ? 'on' : 'off')}
        {...otherProps}/>
      {isUnit && <TextField
        className={classes.unitSelect} variant='filled' size='small' select
        label="unit" value={unit}
        onChange={(event) => handleChangeUnit(event.target.value)}
      >
        {units.map(unit => <MenuItem key={unit} value={unit}>{(new Unit(unit)).label()}</MenuItem>)}
      </TextField>}
    </Box>
  </FormControl>
})
SliderEditQuantity.propTypes = {
  maxValue: PropTypes.number,
  minValue: PropTypes.number,
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

const useDatesEditQuantityStyles = makeStyles(theme => ({
  startDate: {
  },
  endDate: {
    marginLeft: theme.spacing(1)
  }
}))

export const DateTimeEditQuantity = React.memo((props) => {
  const classes = useDatesEditQuantityStyles()
  const {quantityDef, section, onChange, format, time, ...otherProps} = props
  const defaultValue = (quantityDef.default !== undefined ? quantityDef.default : '')
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState()
  const [current, setCurrent] = useState()
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(section[quantityDef.name] || defaultValue || null)
  }, [defaultValue, quantityDef, section])

  const handleAccept = useCallback((newValue) => {
    if (newValue !== null && newValue !== undefined && isNaN(getTime(newValue))) {
      setError('Invalid date format.')
      return
    }
    setError('')
    if (newValue !== undefined) setValue(newValue)
    if (onChange) {
      onChange(newValue || '', section, quantityDef)
    }
  }, [onChange, quantityDef, section])

  const handleChange = useCallback((newValue) => {
    setCurrent(newValue)
  }, [])

  const handleBlur = useCallback(() => {
    handleAccept(current)
  }, [current, handleAccept])

  const renderProps = {
    className: classes.startDate,
    size: 'small',
    error: !!error,
    variant: 'inline',
    inputVariant: 'filled',
    fullWidth: true,
    label: label,
    value: value,
    invalidDateMessage: error,
    onAccept: handleAccept,
    onChange: handleChange,
    onBlur: handleBlur,
    onKeyDown: (event) => { if (event.key === 'Enter') { handleAccept(current) } },
    ...otherProps
  }

  if (time) {
    return <KeyboardTimePicker
      {...renderProps}
      format={format || `HH:mm`}
      keyboardIcon={<AccessTimeIcon />}
    />
  } else {
    return <KeyboardDatePicker
      {...renderProps}
      format={format || `${dateFormat} HH:mm`}
    />
  }
})
DateTimeEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  format: PropTypes.string,
  time: PropTypes.bool
}

export const DateEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props

  return <DateTimeEditQuantity quantityDef={quantityDef} section={section} onChange={onChange} format={dateFormat} {...otherProps}/>
})
DateEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const TimeEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props

  return <DateTimeEditQuantity quantityDef={quantityDef} section={section} onChange={onChange} time {...otherProps}/>
})
TimeEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const DateTimeRangeEditQuantity = React.memo((props) => {
  const classes = useDatesEditQuantityStyles()
  const {quantityDef, section, onChange, format, time, ...otherProps} = props
  const defaultValue = (quantityDef.default !== undefined ? quantityDef.default : ['', ''])
  const label = otherProps.label || quantityDef.name
  const [startDate, setStartDate] = useState((section[quantityDef.name] ? section[quantityDef.name][0] : defaultValue[0]))
  const [endDate, setEndDate] = useState((section[quantityDef.name] ? section[quantityDef.name][1] : defaultValue[1]))
  const [error, setError] = useState('')
  const changed = useRef(false)

  const handleAccept = useCallback((startDate, endDate) => {
    if (!changed.current) {
      return
    }
    const start = getTime(new Date(startDate))
    const end = getTime(new Date(endDate))
    if (start > end) {
      setError('End date cannot be before start date!')
      return
    } else if (isNaN(start) || isNaN(end)) {
      setError('Invalid date format.')
      return
    }
    setError('')
    changed.current = false
    if (onChange) {
      onChange([startDate || '', endDate || ''], section, quantityDef)
    }
  }, [onChange, quantityDef, section])

  const handleStartAccept = useCallback((startDate) => {
    handleAccept(startDate, endDate)
  }, [endDate, handleAccept])

  const handleEndAccept = useCallback((endDate) => {
    handleAccept(startDate, endDate)
  }, [startDate, handleAccept])

  const handleBlurAccept = useCallback(() => {
    handleAccept(startDate, endDate)
  }, [startDate, endDate, handleAccept])

  const handleStartChange = useCallback((date) => {
    changed.current = true
    setStartDate(date)
  }, [])

  const handleEndChange = useCallback((date) => {
    changed.current = true
    setEndDate(date)
  }, [])

  return (
    <Box display='flex'>
      {(!time ? <KeyboardDatePicker
        className={classes.startDate}
        style={{paddingRight: 1}}
        size={'small'}
        error={!!error}
        variant="inline"
        inputVariant="outlined"
        format={format || `${dateFormat} HH:mm`}
        value={startDate}
        invalidDateMessage=""
        InputAdornmentProps={{ position: 'start' }}
        onAccept={handleStartAccept}
        onChange={handleStartChange}
        onBlur={handleBlurAccept}
        onKeyDown={(event) => { if (event.key === 'Enter') { handleBlurAccept() } }}
        {...otherProps}
        label={`${label} (start)`}
      /> : <KeyboardTimePicker
        className={classes.startDate}
        style={{paddingRight: 1}}
        size={'small'}
        error={!!error}
        variant="inline"
        inputVariant="outlined"
        format={format || `HH:mm`}
        value={startDate}
        invalidDateMessage=""
        InputAdornmentProps={{ position: 'start' }}
        onAccept={handleStartAccept}
        onChange={handleStartChange}
        onBlur={handleBlurAccept}
        onKeyDown={(event) => { if (event.key === 'Enter') { handleBlurAccept() } }}
        {...otherProps}
        label={`${label} (start)`}
      />)}
      {(!time ? <KeyboardDatePicker
        className={classes.endDate}
        size={'small'}
        error={!!error}
        variant="inline"
        inputVariant="outlined"
        format={format || `${dateFormat} HH:mm`}
        value={endDate}
        invalidDateMessage=""
        InputAdornmentProps={{ position: 'start' }}
        onAccept={handleEndAccept}
        onChange={handleEndChange}
        onBlur={handleBlurAccept}
        onKeyDown={(event) => { if (event.key === 'Enter') { handleBlurAccept() } }}
        {...otherProps}
        label={`${label} (end)`}
      /> : <KeyboardTimePicker
        className={classes.endDate}
        size={'small'}
        error={!!error}
        variant="inline"
        inputVariant="outlined"
        format={format || `HH:mm`}
        value={endDate}
        invalidDateMessage=""
        InputAdornmentProps={{ position: 'start' }}
        onAccept={handleEndAccept}
        onChange={handleEndChange}
        onBlur={handleBlurAccept}
        onKeyDown={(event) => { if (event.key === 'Enter') { handleBlurAccept() } }}
        {...otherProps}
        label={`${label} (end)`}
      />)}
    </Box>
  )
})
DateTimeRangeEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  format: PropTypes.string,
  time: PropTypes.bool
}

export const DateRangeEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props

  return <DateTimeRangeEditQuantity quantityDef={quantityDef} section={section} onChange={onChange} format={dateFormat} {...otherProps}/>
})
DateRangeEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const TimeRangeEditQuantity = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props

  return <DateTimeRangeEditQuantity quantityDef={quantityDef} section={section} onChange={onChange} time {...otherProps}/>
})
TimeRangeEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const ListEditQuantity = React.memo((props) => {
  const {component, quantityDef, section, ...componentProps} = props
  // const defaultValue = (quantityDef.default !== undefined ? quantityDef.default : [1, 2, 3])
  const [values, setValues] = useState()

  useEffect(() => {
    setValues([1, 2, 3])
  }, [])

  const columns = useMemo(() => {
    return [
      {key: 'value',
        align: 'left',
        render: value => {
          let Component = component
          return <Box maxWidth='300px' whiteSpace='nowrap' textOverflow='ellipsis' overflow='hidden'>
            <Component quantityDef={quantityDef} section={section} {...componentProps}/>
          </Box>
        }
      }
    ]
  }, [component, componentProps, quantityDef, section])

  if (!values) return ''
  return <Datatable columns={columns} data={values.map((value, index) => Object({value: value, index: index}))}>
    <DatatableTable noHeader />
  </Datatable>
})
ListEditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  component: PropTypes.any.isRequired
}

export const ListNumberEditQuantity0 = React.memo((props) => {
  const {quantityDef, section, onChange, ...otherProps} = props
  return <ListEditQuantity component={NumberEditQuantity} quantityDef={quantityDef} section={section} onChange={onChange} {...otherProps} />
})
ListNumberEditQuantity0.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export const ListNumberEditQuantity = React.memo((props) => {
  const classes = useNumberEditQuantityStyles()
  const {quantityDef, section, onChange, minValue, maxValue, ...otherProps} = props
  const label = otherProps.label || quantityDef.name
  const [value, setValue] = useState()
  const [convertedValue, setConvertedValue] = useState()
  const [errors, setErrors] = useState([])
  const systemUnits = useUnits()
  const defaultValue = (quantityDef.default !== undefined ? quantityDef.default : [])
  const dimension = quantityDef.unit && unitMap[quantityDef.unit].dimension
  const units = quantityDef.unit && conversionMap[dimension].units
  const isUnit = quantityDef.unit && ['float64', 'float32', 'float'].includes(quantityDef.type?.type_data)
  const [unit, setUnit] = useState(systemUnits[dimension] || quantityDef.unit)
  const timeout = useRef()

  const convert = useCallback((array, originUnit, targetUnit) => {
    return (isUnit ? array.map(val => `${(!isNaN(Number(val)) || val === '' ? convertUnit(Number(val), originUnit, targetUnit) : '')}`) : array)
  }, [isUnit])

  useEffect(() => {
    let newValue = section[quantityDef.name] || defaultValue
    setValue(newValue)
    setConvertedValue(convert(newValue, quantityDef.unit, unit))
  }, [convert, defaultValue, isUnit, quantityDef, section, unit])

  const handleChangeUnit = useCallback((newUnit) => {
    setUnit(newUnit)
    setConvertedValue(convert(value, quantityDef.unit, newUnit))
  }, [convert, quantityDef, value])

  const isValidNumber = useCallback((value) => {
    if (['int64', 'int32', 'int'].includes(quantityDef.type?.type_data)) {
      const num = Number(value)
      return Number.isInteger(num)
    } else if (['uint64', 'uint32', 'uint'].includes(quantityDef.type?.type_data)) {
      const num = Number(value)
      return Number.isInteger(num) && num > 0
    } else if (['float64', 'float32', 'float'].includes(quantityDef.type?.type_data)) {
      const num = Number(value)
      return !isNaN(num)
    }
  }, [quantityDef])

  const validation = useCallback((newValue, index) => {
    setErrors(errors.filter(error => error.index !== index))
    if (newValue === []) {
      setConvertedValue([])
      setValue([])
    } else if (!isValidNumber(newValue)) {
      setErrors([{index: index, msg: 'Please enter a valid number!'}, ...errors])
    } else {
      let originalValue = (isUnit ? convertUnit(Number(newValue), unit, quantityDef.unit) : newValue)
      let newArray = [...value]
      newArray[index] = newValue
      let originalArray = convert(newArray, unit, quantityDef.unit)
      if (minValue !== undefined && originalValue < minValue) {
        setErrors([{index: index, msg: `The value should be higher than or equal to ${minValue}${(isUnit ? `${(new Unit(quantityDef.unit)).label()}` : '')}`}, ...errors])
      } else if (maxValue !== undefined && originalValue > maxValue) {
        setErrors([{index: index, msg: `The value should be less than or equal to ${maxValue}${(isUnit ? `${(new Unit(quantityDef.unit)).label()}` : '')}`}, ...errors])
      } else {
        setValue(originalArray)
        setConvertedValue(newArray)
      }
    }
  }, [convert, errors, isUnit, isValidNumber, maxValue, minValue, quantityDef, unit, value])

  const handleChangeValue = useCallback((val, index) => {
    let newValue = [...value]
    newValue[index] = val
    setConvertedValue(newValue)
    if (onChange) {
      onChange(convert(newValue, unit, quantityDef.unit), section, quantityDef)
    }
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      validation(newValue[index], index)
    }, 1000)
  }, [value, onChange, convert, unit, quantityDef, section, validation])

  const handleValidator = useCallback((value, index) => {
    validation(value, index)
  }, [validation])

  const columns = useMemo(() => {
    return [
      {key: 'Index', align: 'left', render: row => `${row.index}:`},
      {key: 'Value',
        style: {padding: '0px'},
        align: 'left',
        render: row => {
          return <Box whiteSpace='nowrap' textOverflow='ellipsis' overflow='hidden' display='flex' padding={0} margin={0}>
            <TextField
              fullWidth variant='filled' size='small'
              value={row.value || ''}
              onBlur={event => handleValidator(event.target.value, row.index)} error={!!errors.find(error => error.index === row.index)} helperText={errors.find(error => error.index === row.index)?.msg}
              placeholder={quantityDef.description}
              onChange={event => handleChangeValue(event.target.value, row.index)}
              helpTitle={label} helpDescription={quantityDef.description}
              {...otherProps}
              label={undefined}
            />
          </Box>
        }
      }
    ]
  }, [errors, handleChangeValue, handleValidator, label, otherProps, quantityDef])

  return <Box display={'block'}>
    {Array.isArray(convertedValue) && <Datatable columns={columns} data={convertedValue.map((val, index) => Object({value: val, index: index}))}>
      <DatatableTable noHeader />
    </Datatable>}
    {isUnit && <TextField
      className={classes.unitSelect} variant='filled' size='small' select
      label="unit" value={unit}
      onChange={(event) => handleChangeUnit(event.target.value)}
    >
      {units.map(unit => <MenuItem key={unit} value={unit}>{(new Unit(unit)).label()}</MenuItem>)}
    </TextField>}
  </Box>
})
ListNumberEditQuantity.propTypes = {
  maxValue: PropTypes.number,
  minValue: PropTypes.number,
  quantityDef: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}
