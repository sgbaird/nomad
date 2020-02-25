import React from 'react'
import PropTypes from 'prop-types'
import { withStyles, ExpansionPanel, ExpansionPanelSummary, Typography,
  ExpansionPanelDetails, Stepper, Step, StepLabel, Tooltip, CircularProgress,
  IconButton, DialogTitle, DialogContent, Button, Dialog, DialogActions, FormControl,
  Select, InputLabel, Input, MenuItem, FormHelperText} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ReactJson from 'react-json-view'
import { compose } from 'recompose'
import { withErrors } from '../errors'
import { withRouter } from 'react-router'
import { debug } from '../../config'
import EntryList, { EntryListUnstyled } from '../search/EntryList'
import DeleteIcon from '@material-ui/icons/Delete'
import PublishIcon from '@material-ui/icons/Publish'
import PublishedIcon from '@material-ui/icons/Public'
import UnPublishedIcon from '@material-ui/icons/AccountCircle'
import DecideIcon from '@material-ui/icons/Help'
import { withApi } from '../api'
import Markdown from '../Markdown'
import ConfirmDialog from './ConfirmDialog'
import ClipboardIcon from '@material-ui/icons/Assignment'
import { CopyToClipboard } from 'react-copy-to-clipboard'

class PublishConfirmDialog extends React.Component {
  static propTypes = {
    onPublish: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
  }

  state = {
    embargoLength: 0
  }

  render() {
    const { onPublish, onClose, open } = this.props
    const { embargoLength } = this.state
    return (
      <div>
        <Dialog
          open={open}
          onClose={onClose}
        >
          <DialogTitle>Publish data</DialogTitle>
          <DialogContent>
            <Markdown>{`
              If you agree this upload will be published and move out of your private staging
              area into the public NOMAD. This step is final. All public data will be made available under the Creative
              Commons Attribution license ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).

              If you wish, you can put an embargo on your data. Embargoed data is
              visible to and findable by others. This makes some metadata (e.g.
              chemical formula, system type, spacegroup, etc.) public, but the raw-file
              and archive contents remain hidden (except to you, and users you explicitly
              share the data with).
              You can already create datasets and assign DOIs for data with embargo, e.g.
              to put it into your unpublished paper.
              The embargo will last up to 36 month. Afterwards, your data will be made publicly
              available. You can also lift the embargo on entries at any time.
              This functionality is part of editing entries.
            `}</Markdown>

            <FormControl style={{width: '100%', marginTop: 24}}>
              <InputLabel shrink htmlFor="embargo-label-placeholder">
                Embargo period
              </InputLabel>
              <Select
                value={embargoLength}
                onChange={e => this.setState({embargoLength: e.target.value})}
                input={<Input name="embargo" id="embargo-label-placeholder" />}
                displayEmpty
                name="embargo"
                // className={classes.selectEmpty}
              >
                <MenuItem value={0}>
                  <em>No embargo</em>
                </MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={6}>6</MenuItem>
                <MenuItem value={12}>12</MenuItem>
                <MenuItem value={24}>24</MenuItem>
                <MenuItem value={36}>36</MenuItem>
              </Select>
              <FormHelperText>{embargoLength > 0 ? 'months before the data becomes public' : 'publish without embargo'}</FormHelperText>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onPublish(embargoLength)} color="primary" autoFocus>
              {embargoLength > 0 ? 'Publish with embargo' : 'Publish'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

class Upload extends React.Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    raiseError: PropTypes.func.isRequired,
    api: PropTypes.object.isRequired,
    upload: PropTypes.object.isRequired,
    onDoesNotExist: PropTypes.func,
    open: PropTypes.bool,
    history: PropTypes.object.isRequired
  }

  static styles = theme => ({
    root: {
      marginBottom: theme.spacing.unit
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular
    },
    details: {
      padding: 0,
      display: 'block',
      overflowX: 'auto'
    },
    detailsContent: {
      margin: theme.spacing.unit * 3
    },
    titleContainer: {
      flex: '0 0 auto',
      marginRight: theme.spacing.unit * 2,
      width: 350,
      overflowX: 'hidden'
    },
    titleRow: {
      display: 'flex',
      flexDirection: 'row'
    },
    shortTitle: {
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflowX: 'inherit',
      direction: 'rtl',
      textAlign: 'left'
    },
    title: {
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflowX: 'inherit'
    },
    checkbox: {
      marginRight: theme.spacing.unit * 2
    },
    stepper: {
      width: '100%',
      padding: 0
    },
    buttonCell: {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textAlign: 'right'
    },
    icon: {
      marginLeft: -theme.spacing.unit * 0.5,
      width: theme.spacing.unit * 13 - 2,
      alignItems: 'center',
      display: 'flex'
    },
    clickableRow: {
      cursor: 'pointer'
    },
    decideIcon: {
      color: theme.palette.secondary.main
    }
  })

  static defaultSelectedColumns = ['mainfile', 'parser', 'proc', 'tasks_status']

  state = {
    upload: this.props.upload,
    params: {
      page: 1,
      per_page: 10,
      order_by: 'tasks_status',
      order: 1
    },
    updating: true, // it is still not complete and continuously looking for updates
    showPublishDialog: false,
    showDeleteDialog: false,
    columns: {},
    expanded: null
  }

  _unmounted = false

  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.handleDeleteOpen = this.handleDeleteOpen.bind(this)
    this.handleDeleteCancel = this.handleDeleteCancel.bind(this)
    this.handlePublishCancel = this.handlePublishCancel.bind(this)
    this.handlePublishOpen = this.handlePublishOpen.bind(this)
    this.handlePublishSubmit = this.handlePublishSubmit.bind(this)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.open !== this.props.open && this.props.open) {
      this.setState({expanded: null})
    }

    if (prevProps.domain !== this.props.domain) {
      this.updateColumns()
    }

    if (this.state.updating) {
      return
    }

    if (this.state.params === prevState.params && prevProps.upload.process_running === this.props.upload.process_running) {
      return
    }

    this.update()
  }

  updateColumns() {
    const { domain } = this.props

    const domainColumns = domain ? domain.searchResultColumns : {}
    const otherColumns = {...domainColumns, ...EntryListUnstyled.defaultColumns}
    Object.keys(otherColumns).forEach(key => {
      otherColumns[key] = {
        ...otherColumns[key],
        supportsSort: false
      }
    })
    const columns = {
      mainfile: {
        label: 'Mainfile',
        supportsSort: true
      },
      parser: {
        label: 'Parser',
        supportsSort: true,
        description: 'The parser that was used to process this entry.',
        render: entry => entry.parser.replace('parsers/', '')
      },
      proc: {
        label: 'Processing',
        supportsSort: false,
        description: 'Details on the processing of this entry.',
        render: entry => `${entry.current_task || 'waiting'} [${entry.tasks.indexOf(entry.current_task) + 1}/${entry.tasks.length}]`
      },
      tasks_status: {
        label: 'Status',
        supportsSort: true,
        descriptions: 'Entry processing status',
        render: entry => {
          const { tasks_status, errors, warnings } = entry
          const label = tasks_status.toLowerCase()
          const error = tasks_status === 'FAILURE' || errors.length > 0 || warnings.length > 0
          let tooltip = null
          if (tasks_status === 'FAILURE') {
            tooltip = `Calculation processing failed with errors: ${errors.join(', ')}`
          }
          if (errors.length > 0) {
            tooltip = `Calculation processed with errors: ${errors.join(', ')}`
          }
          if (warnings.length > 0) {
            tooltip = `Calculation processed with warnings: ${warnings.join(', ')}`
          }

          if (error) {
            return <Tooltip title={tooltip}>
              <Typography color="error">
                {label}
              </Typography>
            </Tooltip>
          } else {
            return label
          }
        }
      },
      ...otherColumns
    }
    this.setState({columns: columns})
  }

  update() {
    if (this._unmounted) {
      return
    }

    const {page, per_page, order_by, order} = this.state.params
    this.state.upload.get(page, per_page, order_by, order)
      .then(upload => {
        const {tasks_running, process_running, current_task} = upload
        if (!this._unmounted) {
          const continueUpdating = tasks_running || process_running || current_task === 'uploading'
          this.setState({upload: upload, updating: continueUpdating})
          if (continueUpdating) {
            window.setTimeout(() => {
              this.update()
            }, 500)
          }
        }
      })
      .catch(error => {
        if (!this._unmounted) {
          if (error.name === 'DoesNotExist') {
            this.props.onDoesNotExist()
          } else {
            this.props.raiseError(error)
          }
        }
      })
  }

  componentDidMount() {
    this.updateColumns()
    this.update()
  }

  componentWillUnmount() {
    this._unmounted = true
  }

  handleChange(changes) {
    this.setState({params: {...this.state.params, ...changes}})
  }

  handleDelete() {
    const { api, upload } = this.props
    api.deleteUpload(upload.upload_id)
      .then(() => {
        this.setState({showDeleteDialog: false})
        this.update()
      })
      .catch(error => {
        this.props.raiseError(error)
        this.setState({showDeleteDialog: false})
        this.update()
      })
  }

  handleDeleteOpen() {
    this.setState({showDeleteDialog: true})
  }

  handlePublishOpen() {
    this.setState({showPublishDialog: true})
  }

  handlePublishSubmit(embargoLength) {
    const { api, upload } = this.props
    api.publishUpload(upload.upload_id, embargoLength)
      .then(() => {
        this.setState({showPublishDialog: false})
        this.update()
      })
      .catch(error => {
        this.props.raiseError(error)
        this.setState({showPublishDialog: false})
        this.update()
      })
  }

  handlePublishCancel() {
    this.setState({showPublishDialog: false})
  }

  handleDeleteCancel() {
    this.setState({showDeleteDialog: false})
  }

  renderTitle() {
    const { classes } = this.props
    const { name, create_time, upload_id } = this.state.upload

    return (
      <div className={classes.titleContainer}>
        <div className={classes.titleRow}>
          <Typography variant="h6" className={name ? classes.shortTitle : classes.title}>
            {name || new Date(Date.parse(create_time)).toLocaleString()}
          </Typography>
          <CopyToClipboard
            text={upload_id} onCopy={() => null}
          >
            <Tooltip title={`Copy the upload id to clipboard`} onClick={e => e.stopPropagation()}>
              <IconButton style={{margin: 3, marginRight: 0, padding: 4}}>
                <ClipboardIcon style={{fontSize: 16}} />
              </IconButton>
            </Tooltip>
          </CopyToClipboard>
        </div>
        {name
          ? <Typography variant="subtitle1">
            {new Date(Date.parse(create_time)).toLocaleString()}
          </Typography>
          : 'this upload has no name'
        }
      </div>
    )
  }

  renderStepper() {
    const { classes } = this.props
    const { upload } = this.state
    const { calcs, tasks, current_task, tasks_running, tasks_status, process_running, current_process } = upload

    // map tasks [ uploading, extracting, parse_all, cleanup ] to steps
    const steps = [ 'upload', 'process', 'publish' ]
    let step = null
    const task_index = tasks.indexOf(current_task)
    if (task_index === 0) {
      step = 'upload'
    } else if (task_index > 0 && tasks_running) {
      step = 'process'
    } else if (!upload.published) {
      step = 'publish'
    }
    const stepIndex = upload.published ? steps.length : steps.indexOf(step)

    const labelPropsFactories = {
      upload: (props) => {
        if (step === 'upload') {
          props.children = 'uploading'
          const { uploading } = upload
          if (upload.tasks_status !== 'FAILURE') {
            props.optional = (
              <Typography variant="caption">
                {`${uploading || 0}%`}
              </Typography>
            )
          }
        } else {
          props.children = 'uploaded'
        }
      },
      process: (props) => {
        props.error = tasks_status === 'FAILURE'

        const processIndex = steps.indexOf('process')
        if (stepIndex <= processIndex) {
          props.children = 'processing'
        } else {
          props.children = 'processed'
        }

        if (current_task === 'extracting') {
          props.children = 'extracting'
          props.optional = (
            <Typography variant="caption">
              be patient
            </Typography>
          )
        } else if (current_task === 'parse_all') {
          props.children = 'parsing'
        }

        if (stepIndex >= processIndex) {
          if (!calcs) {
            props.optional = (
              <Typography variant="caption" >
                matching...
              </Typography>
            )
          } else if (calcs.pagination.total > 0) {
            const { total, successes, failures } = calcs.pagination
            if (failures) {
              props.error = true
              props.optional = (
                <Typography variant="caption" color="error">
                  {successes + failures}/{total}, {failures} failed
                </Typography>
              )
            } else {
              props.optional = (
                <Typography variant="caption">
                  {successes + failures}/{total}
                </Typography>
              )
            }
          } else if (tasks_status === 'SUCCESS') {
            props.error = true
            props.optional = (
              <Typography variant="caption" color="error">No calculations found.</Typography>
            )
          }
        }

        if (tasks_status === 'FAILURE') {
          props.optional = (
            <Typography variant="caption" color="error">
              processing failed
            </Typography>
          )
        }
      },
      publish: (props) => {
        if (upload.published) {
          props.children = 'published'
        } else {
          props.children = 'inspect'
          props.StepIconProps = undefined

          if (process_running) {
            if (current_process === 'publish_upload') {
              props.children = 'approved'
              props.optional = <Typography variant="caption">moving data ...</Typography>
            } else if (current_process === 'delete_upload') {
              props.children = 'declined'
              props.optional = <Typography variant="caption">deleting data ...</Typography>
            }
          } else {
            if (stepIndex === 2) {
              props.StepIconProps = {
                icon: <DecideIcon classes={{root: classes.decideIcon}}/>
              }
            }
            props.optional = <Typography variant="caption">publish or delete</Typography>
          }
        }
      }
    }

    return (
      <Stepper activeStep={stepIndex} classes={{root: classes.stepper}}>
        {steps.map((label, index) => {
          const labelProps = {
            children: label
          }

          const labelPropsFactory = labelPropsFactories[label]
          if (labelPropsFactory) {
            labelPropsFactory(labelProps)
          }

          return (
            <Step key={label}>
              <StepLabel {...labelProps} />
            </Step>
          )
        })}
      </Stepper>
    )
  }

  renderCalcTable() {
    const { classes } = this.props
    const { columns, upload } = this.state
    const { calcs, tasks_status, waiting } = this.state.upload

    if (!calcs) {
      return (
        <Typography className={classes.detailsContent}>
          Loading ...
        </Typography>
      )
    }

    const { pagination } = calcs

    if (pagination.total === 0 && tasks_status !== 'SUCCESS') {
      if (this.state.upload.tasks_running) {
        if (waiting) {
          return (
            <Typography className={classes.detailsContent}>
                Uploading ...
            </Typography>
          )
        } else {
          return (
            <Typography className={classes.detailsContent}>
                Processing ...
            </Typography>
          )
        }
      }
    }

    const data = {
      pagination: calcs.pagination,
      results: calcs.results.map(calc => ({
        ...calc.metadata, ...calc
      }))
    }

    const running = upload.tasks_running || upload.process_running

    const actions = upload.published ? <React.Fragment /> : <React.Fragment>
      <IconButton onClick={this.handleDeleteOpen} disabled={running}>
        <Tooltip title="Delete upload">
          <DeleteIcon />
        </Tooltip>
      </IconButton>
      <IconButton disabled={running || tasks_status !== 'SUCCESS' || data.pagination.total === 0} onClick={this.handlePublishOpen}>
        <Tooltip title="Publish upload">
          <PublishIcon />
        </Tooltip>
      </IconButton>
    </React.Fragment>

    return <EntryList
      title={`Upload with ${data.pagination.total} detected entries`}
      query={{upload_id: upload.upload_id}}
      columns={columns}
      selectedColumns={Upload.defaultSelectedColumns}
      editable={tasks_status === 'SUCCESS'}
      data={data}
      onChange={this.handleChange}
      actions={actions}
      showEntryActions={entry => entry.processed}
      {...this.state.params}
    />
  }

  renderStatusIcon() {
    const { classes } = this.props
    const { upload } = this.state

    const render = (icon, tooltip) => (
      <div className={classes.icon}>
        <Tooltip title={tooltip}>
          {icon}
        </Tooltip>
      </div>
    )

    if (upload.tasks_running || upload.process_running) {
      return render(<CircularProgress size={32}/>, '')
    } else if (upload.published) {
      return render(<PublishedIcon size={32} color="primary"/>, 'This upload is published')
    } else {
      return render(<UnPublishedIcon size={32} color="secondary"/>, 'This upload is not published yet, and only visible to you')
    }
  }

  render() {
    const { classes, open } = this.props
    const { upload, showPublishDialog, showDeleteDialog, expanded } = this.state
    const { errors } = upload

    if (this.state.upload) {
      return (
        <div className={classes.root}>
          <ExpansionPanel
            expanded={expanded === null ? open : expanded}
            onChange={(event, expanded) => {
              this.setState({expanded: expanded})
              if (open) {
                this.props.history.push('/uploads')
              }
            }}
          >
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>} >
              {this.renderStatusIcon()}
              {this.renderTitle()}
              {this.renderStepper()}
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{width: '100%'}} classes={{root: classes.details}}>
              {errors && errors.length > 0
                ? <Typography className={classes.detailsContent} color="error">
                  Upload processing has errors: {errors.join(', ')}
                </Typography> : ''
              }
              {this.renderCalcTable()}
              {debug
                ? <div className={classes.detailsContent}>
                  <ReactJson src={upload} enableClipboard={false} collapsed={0} />
                </div> : ''}
            </ExpansionPanelDetails>
          </ExpansionPanel>
          <PublishConfirmDialog
            open={showPublishDialog}
            onClose={this.handlePublishCancel}
            onPublish={this.handlePublishSubmit}
          />
          <ConfirmDialog
            title="Delete an upload"
            content={`
                You are about to delete a non published upload. This cannot be undone,
                but you could re-upload the same file again. Are you sure?
            `}
            confirmLabel="Delete"
            open={showDeleteDialog}
            onClose={this.handleDeleteCancel}
            onConfirm={this.handleDelete}
          />
        </div>
      )
    } else {
      return ''
    }
  }
}

export default compose(withRouter, withErrors, withApi(true, false), withStyles(Upload.styles))(Upload)
