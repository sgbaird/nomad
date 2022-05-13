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

import React from 'react'
import {
  render,
  screen, wait
} from '../conftest.spec'
import {EditQuantityExamples} from './EditQuantityExamples'
import {within} from '@testing-library/dom'
import {fireEvent, waitFor} from '@testing-library/react'

test('correctly renders edit quantities', async () => {
  render(<EditQuantityExamples />)

  // Wait to load the entry metadata, i.e. wait for some texts to appear
  await screen.findByText('three')

  const numberFieldValue = screen.queryAllByTestId('number-edit-quantity-value')
  const numberFieldValueInput = within(numberFieldValue[1]).getByRole('textbox')
  const numberFieldUnit = screen.queryAllByTestId('number-edit-quantity-unit')
  const numberFieldUnitInput = within(numberFieldUnit[0]).getByRole('textbox', { hidden: true })
  const numberFieldCheckBoxs = screen.queryAllByTitle('If checked, numeric value is converted when the unit is changed.')
  const numberFieldCheckBox = within(numberFieldCheckBoxs[0]).getByRole('checkbox', { hidden: true })
  await waitFor(() => expect(numberFieldUnitInput.value).toEqual('bohr'))

  // Check that 'read' mode is enabled
  await waitFor(() => expect(numberFieldCheckBox.checked).toBe(true))

  // Write value in text field, press enter, see that normalize value is written
  // in debug output and that the value in the text field does not change (the
  // value that is returned has gone through some conversions and due to
  // floating point accuracies it's serialized form may change, but detect this and prevent
  // the text from changing)
  fireEvent.change(numberFieldValueInput, { target: { value: '1.5' } })
  fireEvent.keyDown(numberFieldValueInput, {key: 'Enter', code: 'Enter'})
  await waitFor(() => expect(numberFieldValueInput.value).toEqual('1.5'))
  await waitFor(() => expect(screen.queryByText(/"float_unit": 7\.937658163559664e-11/i)).toBeInTheDocument())

  // Change the unit, see that text input changes, debug output remains the same
  fireEvent.change(numberFieldUnitInput, { target: { value: 'angstrom' } })
  fireEvent.keyDown(numberFieldUnitInput, {key: 'Enter', code: 'Enter'})
  await waitFor(() => expect(numberFieldValueInput.value).toEqual('0.7937658163559663'))
  await waitFor(() => expect(screen.queryByText(/"float_unit": 7\.937658163559664e-11/i)).toBeInTheDocument())

  // Enter value with unit, see that only numeric value is preserved in field,
  // unit selection has changed and that debug output is correct
  fireEvent.change(numberFieldValueInput, { target: { value: '1.5m' } })
  fireEvent.keyDown(numberFieldValueInput, {key: 'Enter', code: 'Enter'})
  await waitFor(() => expect(numberFieldValueInput.value).toEqual('1.5'))
  await waitFor(() => expect(numberFieldUnitInput.value).toEqual('m'))
  await waitFor(() => expect(screen.queryByText(/"float_unit": 1\.5/i)).toBeInTheDocument())

  // Change to 'write' mode
  fireEvent.click(numberFieldCheckBox)
  await wait(undefined, 100)
  await waitFor(() => expect(numberFieldCheckBox.checked).toBe(false))

  // Change the unit, see that text input remains the same, debug output changes
  fireEvent.change(numberFieldUnitInput, { target: { value: 'bohr' } })
  fireEvent.keyDown(numberFieldUnitInput, {key: 'Enter', code: 'Enter'})
  await waitFor(() => expect(screen.queryByText(/"float_unit": 7\.937658163559664e-11/i)).toBeInTheDocument())
  await waitFor(() => expect(numberFieldValueInput.value).toEqual('1.5'))

  // Enter value with unit, see that only numeric value is preserved in field,
  // unit selection has changed and that debug output is correct
  fireEvent.change(numberFieldValueInput, { target: { value: '1.5angstrom' } })
  fireEvent.keyDown(numberFieldValueInput, {key: 'Enter', code: 'Enter'})
  await waitFor(() => expect(numberFieldValueInput.value).toEqual('1.5'))
  await waitFor(() => expect(numberFieldUnitInput.value).toEqual('Å'))
  await waitFor(() => expect(screen.queryByText(/"float_unit": 1\.5e-10/i)).toBeInTheDocument())
})