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
import React, { useState } from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import FilterMainMenu from './menus/FilterMainMenu'
import SearchBar from './SearchBar'
import SearchResults from './results/SearchResults'
import {
  useMenuOpenState
} from './SearchContext'
import { Box } from '@material-ui/core'

/**
 * The primary search interface that is reused throughout the application in
 * different contexts. Displays a menu of filters, a search bar, a list of
 * results and optionally a customizable header above the search bar.
 */
const useStyles = makeStyles(theme => {
  return {
    root: {
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      width: '100%'
    },
    leftColumn: {
      flexShrink: 0,
      flexGrow: 0,
      height: '100%',
      zIndex: 2
    },
    leftColumnCollapsed: {
      maxWidth: '4rem'
    },
    center: {
      flexGrow: 1,
      height: '100%',
      overflow: 'scroll'
    },
    searchBar: {
      display: 'flex',
      flexGrow: 0,
      zIndex: 1
    }
  }
})

const Search = React.memo(({
  collapsed,
  header
}) => {
  const styles = useStyles()
  const [isMenuOpen, setIsMenuOpen] = useMenuOpenState(false)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  return <div className={styles.root}>
    <div className={clsx(styles.leftColumn, isCollapsed && styles.leftColumnCollapsed)}>
      <FilterMainMenu
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        collapsed={isCollapsed}
        onCollapsedChange={setIsCollapsed}
      />
    </div>
    <div className={styles.center} onClick={() => setIsMenuOpen(false)}>
      <Box margin={3}>
        <Box marginBottom={2}>
          {header}
        </Box>
        <Box marginBottom={2}>
          <SearchBar className={styles.searchBar} />
        </Box>
        <SearchResults />
      </Box>
    </div>
  </div>
})
Search.propTypes = {
  collapsed: PropTypes.bool,
  header: PropTypes.node
}

export default Search
