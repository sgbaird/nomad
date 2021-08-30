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
import PropTypes from 'prop-types'
import {
  FilterMenu,
  FilterMenuItem,
  FilterMenuItems,
  FilterSubMenus
} from './FilterMenu'

import FilterSubMenuMaterial from './FilterSubMenuMaterial'
import FilterSubMenuElements from './FilterSubMenuElements'
import FilterSubMenuSymmetry from './FilterSubMenuSymmetry'
import FilterSubMenuMethod from './FilterSubMenuMethod'
import FilterSubMenuSimulation from './FilterSubMenuSimulation'
import FilterSubMenuDFT from './FilterSubMenuDFT'
import FilterSubMenuGW from './FilterSubMenuGW'
import FilterSubMenuElectronic from './FilterSubMenuElectronic'
import FilterSubMenuVibrational from './FilterSubMenuVibrational'
import FilterSubMenuAuthor from './FilterSubMenuAuthor'
import FilterSubMenuAccess from './FilterSubMenuAccess'
import FilterSubMenuDataset from './FilterSubMenuDataset'
import FilterSubMenuIDs from './FilterSubMenuIDs'
import {
  labelMaterial,
  labelElements,
  labelSymmetry,
  labelMethod,
  labelSimulation,
  labelDFT,
  labelGW,
  labelProperties,
  labelElectronic,
  labelVibrational,
  labelAuthor,
  labelDataset,
  labelIDs,
  labelAccess
} from '../FilterContext'

/**
 * Swipable menu that shows the available filters on the left side of the
 * screen.
 */
const FilterMainMenu = React.memo(({
  open,
  onOpenChange,
  collapsed,
  onCollapsedChange,
  resultType,
  onResultTypeChange
}) => {
  const [value, setValue] = React.useState()

  return <FilterMenu
    selected={value}
    onSelectedChange={setValue}
    open={open}
    onOpenChange={onOpenChange}
    collapsed={collapsed}
    onCollapsedChange={onCollapsedChange}
  >
    <FilterMenuItems>
      <FilterMenuItem value={labelMaterial} depth={0}/>
      <FilterMenuItem value={labelElements} depth={1}/>
      <FilterMenuItem value={labelSymmetry} depth={1}/>
      <FilterMenuItem value={labelMethod} depth={0}/>
      <FilterMenuItem value={labelSimulation} depth={1}/>
      <FilterMenuItem value={labelDFT} depth={2}/>
      <FilterMenuItem value={labelGW} depth={2}/>
      <FilterMenuItem value={labelProperties} depth={0} disableButton/>
      <FilterMenuItem value={labelElectronic} depth={1}/>
      <FilterMenuItem value={labelVibrational} depth={1}/>
      <FilterMenuItem value={labelAuthor} depth={0}/>
      <FilterMenuItem value={labelDataset} depth={0}/>
      <FilterMenuItem value={labelAccess} depth={0}/>
      <FilterMenuItem value={labelIDs} depth={0}/>
    </FilterMenuItems>
    <FilterSubMenus>
      <FilterSubMenuMaterial value={labelMaterial}/>
      <FilterSubMenuElements value={labelElements} size="large"/>
      <FilterSubMenuSymmetry value={labelSymmetry}/>
      <FilterSubMenuMethod value={labelMethod}/>
      <FilterSubMenuSimulation value={labelSimulation}/>
      <FilterSubMenuDFT value={labelDFT}/>
      <FilterSubMenuGW value={labelGW}/>
      <FilterSubMenuElectronic value={labelElectronic}/>
      <FilterSubMenuVibrational value={labelVibrational}/>
      <FilterSubMenuAuthor value={labelAuthor}/>
      <FilterSubMenuDataset value={labelDataset}/>
      <FilterSubMenuAccess value={labelAccess}/>
      <FilterSubMenuIDs value={labelIDs}/>
    </FilterSubMenus>
  </FilterMenu>
})
FilterMainMenu.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  collapsed: PropTypes.bool,
  onCollapsedChange: PropTypes.func,
  resultType: PropTypes.string,
  onResultTypeChange: PropTypes.func
}

export default FilterMainMenu
